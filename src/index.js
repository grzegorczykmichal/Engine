import "./styles.css";

class Vector {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  static From(v) {
    return new Vector(v.x, v.y, v.z);
  }

  toArray() {
    return [this.x, this.y, this.z];
  }
}

class Triangle {
  constructor(x = new Vector(), y = new Vector(), z = new Vector()) {
    this.vectors = [x, y, z];
  }
  static From(triangle) {
    return new Triangle(
      Vector.From(triangle.vectors[0]),
      Vector.From(triangle.vectors[1]),
      Vector.From(triangle.vectors[2])
    );
  }
}

class Mesh {
  constructor(triangles = [new Triangle()]) {
    this.triangles = triangles;
  }
}

const makeRenderer = canvas => {
  const ctx = canvas.getContext("2d");

  const WIDTH = +getComputedStyle(canvas)
    .getPropertyValue("width")
    .slice(0, -2);

  const HEIGHT = +getComputedStyle(canvas)
    .getPropertyValue("height")
    .slice(0, -2);

  const dpi = window.devicePixelRatio;
  canvas.setAttribute("height", HEIGHT * dpi);
  canvas.setAttribute("width", WIDTH * dpi);

  const projMatrix = initProjectionMatrix({
    width: WIDTH,
    height: HEIGHT,
    fov: 90,
    near: 0.1,
    far: 1000
  });

  const startTime = Date.now();

  return cb => {
    ctx.save();
    cb(ctx, projMatrix, WIDTH, HEIGHT, Date.now() - startTime);
    ctx.restore();
  };
};

const qube = new Mesh([
  new Triangle(new Vector(), new Vector(0, 1, 0), new Vector(1, 1, 0)),
  new Triangle(new Vector(), new Vector(1, 1, 0), new Vector(1, 0, 0)),

  new Triangle(new Vector(1, 0, 0), new Vector(1, 1, 0), new Vector(1, 1, 1)),
  new Triangle(new Vector(1, 0, 0), new Vector(1, 1, 1), new Vector(1, 0, 1)),

  new Triangle(new Vector(1, 0, 1), new Vector(1, 1, 1), new Vector(0, 1, 1)),
  new Triangle(new Vector(1, 0, 1), new Vector(0, 1, 1), new Vector(0, 0, 1)),

  new Triangle(new Vector(0, 0, 1), new Vector(0, 1, 1), new Vector(0, 1, 0)),
  new Triangle(new Vector(0, 0, 1), new Vector(0, 1, 0), new Vector(0, 0, 0)),

  new Triangle(new Vector(0, 1, 0), new Vector(0, 1, 1), new Vector(1, 1, 1)),
  new Triangle(new Vector(0, 1, 0), new Vector(1, 1, 1), new Vector(1, 1, 0)),

  new Triangle(new Vector(1, 0, 1), new Vector(0, 0, 1), new Vector(0, 0, 0)),
  new Triangle(new Vector(1, 0, 1), new Vector(0, 0, 0), new Vector(1, 0, 0))
]);

function initProjectionMatrix({ width, height, fov, near, far }) {
  const aspectRatio = width / height;
  const foVRad = 1 / Math.tan(((fov * 0.5) / 180) * Math.PI);
  const matrix = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];

  matrix[0][0] = aspectRatio * foVRad;
  matrix[1][1] = foVRad;
  matrix[2][2] = far / (far - near);
  matrix[3][2] = (-far * near) / far - near;
  matrix[2][3] = 1;

  return matrix;
}

function multiply([x, y, z], m) {
  const w = x * m[0][3] + y * m[1][3] + z * m[2][3] + m[3][3];

  if (w === 0) {
    throw Error("w is 0");
  }

  const tempX = x * m[0][0] + y * m[1][0] + z * m[2][0] + m[3][0];
  const tempY = x * m[0][1] + y * m[1][1] + z * m[2][1] + m[3][1];
  const tempZ = x * m[0][2] + y * m[1][2] + z * m[2][2] + m[3][2];

  return [tempX / w, tempY / w, tempZ / w];
}

function drawLine(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawTriangle(ctx, x1, y1, x2, y2, x3, y3) {
  drawLine(ctx, x1, y1, x2, y2);
  drawLine(ctx, x2, y2, x3, y3);
  drawLine(ctx, x3, y3, x1, y1);
}

const canvas = document.querySelector("canvas");
const render = makeRenderer(canvas);

function repeatOften() {
  render((ctx, projMatrix, screenWidth, screenHeight, time) => {
    // ctx.clerRect(0, 0, screenWidth, screenHeight);
    for (const tri of qube.triangles) {
      const triTranslated = Triangle.From(tri);
      triTranslated.vectors[0].z = tri.vectors[0].z + 3;
      triTranslated.vectors[1].z = tri.vectors[1].z + 3;
      triTranslated.vectors[2].z = tri.vectors[2].z + 3;

      var newtri = new Triangle(
        new Vector(...multiply(triTranslated.vectors[0].toArray(), projMatrix)),
        new Vector(...multiply(triTranslated.vectors[1].toArray(), projMatrix)),
        new Vector(...multiply(triTranslated.vectors[2].toArray(), projMatrix))
      );

      newtri.vectors[0].x += 1;
      newtri.vectors[1].x += 1;
      newtri.vectors[2].x += 1;

      newtri.vectors[0].y += 1;
      newtri.vectors[1].y += 1;
      newtri.vectors[2].y += 1;

      newtri.vectors[0].x *= 0.5 * screenWidth;
      newtri.vectors[1].x *= 0.5 * screenWidth;
      newtri.vectors[2].x *= 0.5 * screenWidth;

      newtri.vectors[0].y *= 0.5 * screenHeight;
      newtri.vectors[1].y *= 0.5 * screenHeight;
      newtri.vectors[2].y *= 0.5 * screenHeight;

      drawTriangle(
        ctx,
        newtri.vectors[0].x,
        newtri.vectors[0].y,
        newtri.vectors[1].x,
        newtri.vectors[1].y,
        newtri.vectors[2].x,
        newtri.vectors[2].y
      );
    }
  });

  requestAnimationFrame(repeatOften);
}
requestAnimationFrame(repeatOften);