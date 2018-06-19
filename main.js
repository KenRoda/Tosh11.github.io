phina.globalize();

var BLOCK_WIDTH = 40 * 2;
var BLOCK_HEIGHT = 60 / 2;
var PADDLE_WIDTH = BLOCK_WIDTH * 1.5;
var PADDLE_HEIGHT = BLOCK_HEIGHT;
var BALL_RADIUS = BLOCK_WIDTH / 8;

phina.define('MainScene', {
  superClass: 'DisplayScene',

  init: function () {
    this.superInit();
    this.backgroundColor = 'black';

    this.blockGroup = DisplayElement().addChildTo(this);
    this.dummyGroup = DisplayElement().addChildTo(this);
    var screenRect = Rect(0, 0, 640, 960);
    var self = this;

    Array.range(2, 16, 2).each(function (spanX) {
      Array.range(1, 4, 0.5).each(function (spanY) {
        Block().addChildTo(self.blockGroup)
          .setPosition(self.gridX.span(spanX), self.gridY.span(spanY));

      })

    });
    // パドル移動ライン
    var paddleY = this.gridY.span(14.5);
    // パドル設置
    var paddle = Paddle().addChildTo(this)
      .setPosition(this.gridX.center(), paddleY);
    this.onpointmove = function (e) {
      // タッチ位置に移動
      paddle.setPosition(e.pointer.x | 0, paddleY);
      // 画面はみ出し防止
      if (paddle.left < screenRect.left) {
        paddle.left = screenRect.left;
      }
      if (paddle.right > screenRect.right) {
        paddle.right = screenRect.right;
      }
    };
    this.onpointend = function () {
      if (self.status === 'ready') {
        // ボール発射
        self.ball.vy = -self.ball.speed;
        self.status = 'move';
      }
    };
    this.score = 0;
    var scoreLabel = Label({
      text: this.score + '',
      fill: 'lime',
      fontSize: 64,
    });
    // .addChildTo(this);
    scoreLabel.setPosition(this.gridX.center(), this.gridY.center());
    scoreLabel.alpha = 0.6;
    this.hitNumber = 0;
    // ボール作成
    this.ball = Ball().addChildTo(this);
    // シーン全体から参照可能にする
    this.paddle = paddle;
    this.screenRect = screenRect;
    this.scoreLabel = scoreLabel;
    this.status = 'ready';
  },
  update: function () {
    var ball = this.ball;
    var paddle = this.paddle;
    var screenRect = this.screenRect;

    // ボールはパドルの真上
    if (this.status === 'ready') {
      ball.vx = ball.vy = 0;
      ball.x = paddle.x;
      ball.bottom = paddle.top;
    }

    if (this.status === 'move') {
      // ボール移動
      ball.moveBy(ball.vx, ball.vy);
      // 画面端反射
      // 上
      if (ball.top < screenRect.top) {
        ball.top = screenRect.top;
        ball.vy = -ball.vy;
      }
      // 左
      if (ball.left < screenRect.left) {
        ball.left = screenRect.left;
        ball.vx = -ball.vx;
      }
      // 右
      if (ball.right > screenRect.right) {
        ball.right = screenRect.right;
        ball.vx = -ball.vx;
      }
      // 落下
      if (ball.top > screenRect.bottom) {
        // 準備状態へ
        var label = Label({
          text: 'GAME OVER',
          fill: 'yellow',
          fontSize: 64,
        }).addChildTo(this);
        label.setPosition(this.gridX.center(), this.gridY.center());
        label.tweener.clear()
          .wait(1000)
          .call(function () {
            self.nextLabel = 'title';
            self.exit();
          });
        this.status = 'ready';
      }
      // パドルとの反射
      if (ball.hitTestElement(paddle) && ball.vy > 0) {
        ball.bottom = paddle.top;
        ball.vy = -ball.vy;
        // 当たった位置で角度を変化させる
        var dx = paddle.x - ball.x;
        ball.vx = -dx / 5;
      }
      var self = this;
      this.blockGroup.children.some(function (block) {
        // ヒットなら
        if (ball.hitTestElement(block)) {
          // 左上かど
          if (ball.top < block.top && ball.left < block.left) {
            // 位置補正
            ball.right = block.left;
            ball.bottom = block.top;
            // 移動方向設定
            ball.vx = -ball.speed;
            ball.vy = -ball.speed;
            self.disableBlock(block);
            return true;
          }
          // 右上かど
          if (block.top < ball.top && block.right < ball.right) {
            ball.left = block.right;
            ball.bottom = block.top;
            ball.vx = ball.speed;
            ball.vy = -ball.speed;
            self.disableBlock(block);
            return true;
          }
          // 左下かど
          if (block.bottom < ball.bottom && ball.left < block.left) {
            ball.right = block.left;
            ball.top = block.bottom;
            ball.vx = -ball.speed;
            ball.vy = ball.speed;
            self.disableBlock(block);
            return true;
          }
          // 右下かど
          if (block.bottom < ball.bottom && block.right < ball.right) {
            ball.left = block.right;
            ball.top = block.bottom;
            ball.vx = ball.speed;
            ball.vy = ball.speed;
            self.disableBlock(block);
            return true;
          }
          // 左側
          if (ball.left < block.left) {
            ball.right = block.left;
            ball.vx = -ball.vx;
            self.disableBlock(block);
            return true;
          }
          // 右側
          if (block.right < ball.right) {
            ball.left = block.right;
            ball.vx = -ball.vx;
            self.disableBlock(block);
            return true;
          }
          // 上側
          if (ball.top < block.top) {
            ball.bottom = block.top;
            ball.vy = -ball.vy;
            self.disableBlock(block);
            return true;
          }
          // 下側
          if (block.bottom < ball.bottom) {
            ball.top = block.bottom;
            ball.vy = -ball.vy;
            self.disableBlock(block);
            return true;
          }
        }
      });
      if (this.blockGroup.children.length === 0) {
        if (confirm('クリアおめでとう！このゲームの作成動画を見る？')) {
          window.location = "https://www.youtube.com/watch?v=gHus-o2TRVM&feature=youtu.be";
        }
        this.exit({
          score: this.score,
        });
      }
    }
  },
  disableBlock: function (block) {
    var dummy = Block().addChildTo(this.dummyGroup);
    dummy.x = block.x;
    dummy.y = block.y;
    block.remove();
    dummy.tweener.clear()
      .to({scaleX: 0.1, scaleY: 0.1}, 200)
      .call(function () {
        dummy.remove();
      });
    this.addScore();
  },
  addScore: function () {
    this.hitNumber++;
    this.score += this.hitNumber * 10;
    this.scoreLabel.text = this.score;

  }
});

phina.define('Block', {
  superClass: 'RectangleShape',
  init: function () {
    this.superInit({
      width: BLOCK_WIDTH,
      height: BLOCK_HEIGHT,
    });
  }
});
phina.define('Paddle', {
  // 親クラス指定
  superClass: 'RectangleShape',
  // コンストラクタ
  init: function () {
    // 親クラス初期化
    this.superInit({
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      fill: 'silver',
    });
  },
});
phina.define('Ball', {
  // 親クラス指定
  superClass: 'CircleShape',
  // コンストラクタ
  init: function () {
    // 親クラス初期化
    this.superInit({
      radius: BALL_RADIUS,
      fill: 'silver',
    });
    this.speed = 6;
  },
});
phina.main(function () {
  var app = GameApp({
    title: 'ブロック崩し'
  });
  app.fps = 60;
  app.run();
});
