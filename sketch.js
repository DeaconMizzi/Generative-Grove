let trees = [];
let fireflies = [];
let leaves = [];
let windFactor = 1;
let weatherCondition = "Clear"; // Default
let timeOfDay = 0; // Simulated time (0 to 1: day to night)
let apiKey = "db4333d472a55f17a1eff793bbc23e16";
let city = "Valletta,MT";

function setup() {
  let canvas = createCanvas(960, 540);
  canvas.parent('canvas-container');
  let url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  loadJSON(url, gotWeather);
  for (let i = 0; i < 50; i++) {
    fireflies.push(new Firefly());
  }
}

function draw() {
  drawBackground();
  for (let f of fireflies) {
    f.update();
    f.display();
  }
  for (let i = leaves.length - 1; i >= 0; i--) {
    leaves[i].update();
    leaves[i].display();
    if (leaves[i].isDead()) {
      leaves.splice(i, 1);
    }
  }
  for (let t of trees) {
    t.grow();
  }
}

function drawBackground() {
  timeOfDay = (sin(frameCount * 0.001) + 1) / 2; // 0 to 1 day-night loop

  let topColor = lerpColor(color(10, 10, 50), color(100, 150, 255), timeOfDay);
  let bottomColor = lerpColor(color(30, 30, 60), color(200, 220, 255), timeOfDay);

  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(topColor, bottomColor, inter);
    stroke(c);
    line(0, y, width, y);
  }

  if (weatherCondition === "Clouds") {
    fill(100, 100, 100, 30);
    rect(0, 0, width, height);
  }
  if (weatherCondition === "Rain") {
    for (let i = 0; i < 50; i++) {
      let rx = random(width);
      let ry = random(height);
      stroke(180, 200, 255, 150);
      line(rx, ry, rx + random(-2, 2), ry + 10);
    }
  }
}

function mousePressed() {
  let depth = map(mouseY, height, 0, 0.3, 1);
  trees.push(new Tree(mouseX, height, -PI / 2, 60 * depth, 5 * depth, depth));
}

function gotWeather(data) {
  let windSpeed = data.wind.speed;
  windFactor = map(windSpeed, 0, 10, 0.5, 2);
  weatherCondition = data.weather[0].main; // e.g., "Clear", "Rain", "Clouds"
  console.log(`Weather: ${weatherCondition} | Wind: ${windSpeed} m/s | Sway: ${windFactor}`);
}

class Tree {
  constructor(x, y, angle, length, thickness, depth) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.length = length;
    this.thickness = thickness;
    this.depth = depth;
    this.swayOffset = random(1000);
    this.branchSpread = random(PI / 12, PI / 6);
    this.branchChance = random(0.7, 0.9);
  }

  grow() {
    push();
    translate(this.x, this.y);
    this.branch(this.length, this.thickness, this.angle, this.swayOffset, this.x, this.y, true);
    pop();
  }

  branch(len, thick, angle, swaySeed, globalX, globalY, firstBranch = false) {
    let sway = map(noise(swaySeed + frameCount * 0.01 * this.depth), 0, 1, -PI / 32, PI / 32);
    let swayAngle = angle + sway * windFactor;

    if (thick > 3) {
      stroke(80, 50, 20);
    } else if (thick > 1.5) {
      stroke(120, 70, 30);
    } else {
      let green = map(this.depth, 0.3, 1, 100, 200);
      stroke(50, green, 50);
    }

    strokeWeight(thick);
    let x2 = cos(swayAngle) * len;
    let y2 = sin(swayAngle) * len;
    line(0, 0, x2, y2);

    if (random() < 0.001 && thick < 2) {
      leaves.push(new Leaf(globalX + x2, globalY + y2));
    }

    translate(x2, y2);

    if (len > 4) {
      if (firstBranch || this.branchChance > 0.75) {
        push();
        this.branch(len * 0.7, thick * 0.7, swayAngle + this.branchSpread, swaySeed, globalX + x2, globalY + y2, false);
        pop();
      }
      if (firstBranch || this.branchChance > 0.75) {
        push();
        this.branch(len * 0.7, thick * 0.7, swayAngle - this.branchSpread, swaySeed + 100, globalX + x2, globalY + y2, false);
        pop();
      }
    }
  }
}

class Firefly {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = p5.Vector.random2D().mult(0.5);
    this.flickerSpeed = random(0.02, 0.05);
    this.phase = random(TWO_PI);
  }

  update() {
    this.pos.add(this.vel);
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.y < 0) this.pos.y = height;
    if (this.pos.y > height) this.pos.y = 0;
    this.phase += this.flickerSpeed;
  }

  display() {
    noStroke();
    let flicker = sin(this.phase) * 100 + 150;
    fill(255, 255, 100, flicker);
    ellipse(this.pos.x, this.pos.y, 3, 3);
  }
}

class Leaf {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-0.1, 0.1), random(0.05, 0.2));
    this.size = random(3, 5);
    this.alpha = 255;
  }

  update() {
    this.pos.add(this.vel);
    this.alpha -= 0.5;
  }

  display() {
    noStroke();
    fill(100, 180, 100, this.alpha);
    ellipse(this.pos.x, this.pos.y, this.size);
  }

  isDead() {
    return this.alpha <= 0;
  }
}
