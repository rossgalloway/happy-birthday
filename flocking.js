// Code modified from:
// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Flock object
// Does very little, simply manages the array of all the boids

function Flock() {
  // An array for all the boids
  this.boids = [] // Initialize the array
}

Flock.prototype.run = function () {
  for (let i = 0; i < this.boids.length; i++) {
    this.boids[i].run(this.boids) // Passing the entire list of boids to each boid individually
  }
}

Flock.prototype.addBoid = function (b) {
  this.boids.push(b)
}

// Boid class
// Methods for Separation, Cohesion, Alignment added

function Boid(x, y) {
  this.acceleration = createVector(0, 0)
  this.velocity = createVector(random(-150, 150), random(-150, 150))
  this.position = createVector(x, y)
  this.rFind = 25.0
  this.maxspeed = 10 // Maximum speed
  this.maxforce = 0.1 // Maximum steering force
  this.wingFlapCadence = random(1, 6)
}

Boid.prototype.run = function (boids) {
  this.flock(boids)
  this.update()
  //add boolean passed in to borders to trigger on initial mouse click
  this.borders()
  this.render()
}

Boid.prototype.applyForce = function (force) {
  // We could add mass here if we want A = F / M
  this.acceleration.add(force)
}

// We accumulate a new acceleration each time based on three rules
Boid.prototype.flock = function (boids) {
  let sep = this.separate(boids) // Separation
  let ali = this.align(boids) // Alignment
  let coh = this.cohesion(boids) // Cohesion
  let avoidMouse = this.avoidMouse()
  //TODO add other vertices
  let avoidTitle = this.avoidTitle(pointsToAvoid)
  let topPull = this.topPull()
  // Arbitrarily weight these forces
  sep.mult(2)
  ali.mult(1)
  coh.mult(1)
  topPull.mult(1)
  avoidMouse.mult(50)
  avoidTitle.mult(4)
  // Add the force vectors to acceleration
  this.applyForce(sep)
  this.applyForce(ali)
  this.applyForce(coh)
  this.applyForce(topPull)
  this.applyForce(avoidMouse)
  this.applyForce(avoidTitle)
}

// Method to update location
Boid.prototype.update = function () {
  // Update velocity
  this.velocity.add(this.acceleration)
  // Limit speed
  this.velocity.limit(this.maxspeed)
  this.position.add(this.velocity)
  // Reset accelertion to 0 each cycle
  this.acceleration.mult(0)
}

// A method that calculates and applies a steering force towards a target
// STEER = DESIRED MINUS VELOCITY
Boid.prototype.seek = function (target) {
  let desired = p5.Vector.sub(target, this.position) // A vector pointing from the location to the target
  // Normalize desired and scale to maximum speed
  desired.normalize()
  desired.mult(this.maxspeed)
  // Steering = Desired minus Velocity
  let steer = p5.Vector.sub(desired, this.velocity)
  steer.limit(this.maxforce) // Limit to maximum steering force
  return steer
}

Boid.prototype.render = function () {
  // Draw a triangle rotated in the direction of velocity
  let theta = this.velocity.heading() + radians(90)
  // fill(40,20,20)
  stroke(40, 20, 20)
  push()
  translate(this.position.x, this.position.y)
  rotate(theta)
  wingTiming = flappyCounter + this.wingFlapCadence
  wingG = map(sin(wingTiming), -1, 1, 180, 150)
  wingB = map(sin(wingTiming), -1, 1, 200, 180)
  fill(255, wingG, wingB)
  heartFlapPosition1 = map(
    sin(wingTiming),
    -1,
    1,
    1.0 * this.rFind,
    0.4 * this.rFind
  )
  heartFlapPosition2 = map(
    sin(wingTiming),
    -1,
    1,
    0.66 * this.rFind,
    0.33 * this.rFind
  )
  heartFlapPosition3 = map(
    sin(wingTiming),
    -1,
    1,
    -0.92 * this.rFind,
    -0.85 * this.rFind
  )
  heartFlapPosition4 = map(
    sin(wingTiming),
    -1,
    1,
    1.25 * this.rFind,
    1.33 * this.rFind
  )

  cofH = 0
  bofH = heartFlapPosition4
  rofH = heartFlapPosition1
  bezTop = heartFlapPosition3
  bezAX = heartFlapPosition2
  bezAY = 0.66 * this.rFind
  bezBX = rofH
  bezBY = 0.36 * this.rFind

  beginShape()
  vertex(cofH, bofH) // bottom of heart
  bezierVertex(bezAX, bezAY, bezBX, bezBY, rofH, cofH)
  bezierVertex(rofH, bezTop, cofH, bezTop, cofH, cofH)
  endShape(CLOSE)
  beginShape()
  vertex(cofH, bofH) // bottom of heart
  bezierVertex(-bezAX, bezAY, -bezBX, bezBY, -rofH, cofH)
  bezierVertex(-rofH, bezTop, cofH, bezTop, cofH, cofH)
  endShape(CLOSE)
  pop()
}

// Wraparound
//TODO: start with close borders and expand on click.
Boid.prototype.borders = function () {
  if (this.position.x < 0 - this.rFind) this.position.x = width + this.rFind
  if (this.position.y < -height * 0.25 - this.rFind)
    this.position.y = height * 3 + this.rFind
  if (this.position.x > width + this.rFind) this.position.x = 0 - this.rFind
  if (this.position.y > height * 3 + this.rFind)
    this.position.y = -height * 0.25 - this.rFind
}

// Separation
// Method checks for nearby boids and steers away
Boid.prototype.separate = function (boids) {
  let desiredSeparation = 200.0
  let steer = createVector(0, 0)
  let count = 0
  // For every boid in the system, check if it's too close
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position, boids[i].position)
    // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
    if (d > 0 && d < desiredSeparation) {
      // Calculate vector pointing away from neighbor
      let diff = p5.Vector.sub(this.position, boids[i].position)
      diff.normalize()
      diff.div(d) // Weight by distance
      steer.add(diff)
      count++ // Keep track of how many
    }
  }
  // Average -- divide by how many
  if (count > 0) {
    steer.div(count)
  }

  // As long as the vector is greater than 0
  if (steer.mag() > 0) {
    // Implement Reynolds: Steering = Desired - Velocity
    steer.normalize()
    steer.mult(this.maxspeed)
    steer.sub(this.velocity)
    steer.limit(this.maxforce)
  }
  return steer
}

// Mouse Avoidance
// Method checks for the mouse location and steers away
Boid.prototype.avoidMouse = function () {
  let desiredSeparation = 100.0
  let steer = createVector(0, 0)
  let count = 0
  // For every boid in the system, check if it's too close
  var mousePosition = createVector(mouseX, mouseY)
  let d = p5.Vector.dist(this.position, mousePosition)
  // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
  if (d > 0 && d < desiredSeparation) {
    // Calculate vector pointing away from neighbor
    let diff = p5.Vector.sub(this.position, mousePosition)
    diff.normalize()
    diff.div(d) // Weight by distance
    steer.add(diff)
    count++ // Keep track of how many
  }

  // Average -- divide by how many
  if (count > 0) {
    steer.div(count)
  }

  // As long as the vector is greater than 0
  if (steer.mag() > 0) {
    // Implement Reynolds: Steering = Desired - Velocity
    steer.normalize()
    steer.mult(this.maxspeed)
    steer.sub(this.velocity)
    steer.limit(this.maxforce)
  }
  return steer
}

// Title Avoidance
// Method checks for the mouse location and steers away
Boid.prototype.avoidTitle = function (textVertices) {
  let desiredSeparation = 150.0
  let steer = createVector(0, 0)
  let count = 0
  // For every boid in the system, check if it's too close
  for (let i = 0; i < textVertices.length; i++) {
    vertexVector = createVector(textVertices[i][0], textVertices[i][1])
    let d = p5.Vector.dist(this.position, vertexVector)
    // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
    if (d > 0 && d < desiredSeparation) {
      // Calculate vector pointing away from neighbor
      let diff = p5.Vector.sub(this.position, vertexVector)
      diff.normalize()
      diff.div(d) // Weight by distance
      steer.add(diff)
      count++ // Keep track of how many
    }
  }
  // Average -- divide by how many
  if (count > 0) {
    steer.div(count)
  }

  // As long as the vector is greater than 0
  if (steer.mag() > 0) {
    // Implement Reynolds: Steering = Desired - Velocity
    steer.normalize()
    steer.mult(this.maxspeed)
    steer.sub(this.velocity)
    steer.limit(this.maxforce)
  }
  return steer
}

// Top Attractor
// Method steers toward the top of the canvas
Boid.prototype.topPull = function () {
  let desiredSeparation = height * 3
  let steer = createVector(0, 0)
  let count = 0
  // For every boid in the system, check if it's too close
  var topVector = createVector(this.position.x, height * 3)
  let d = p5.Vector.dist(this.position, topVector)
  // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
  if (d > 0 && d < desiredSeparation) {
    // Calculate vector pointing away from neighbor
    let diff = p5.Vector.sub(this.position, topVector)
    diff.normalize()
    // diff.div(d) // Weight by distance
    steer.add(diff)
    count++ // Keep track of how many
  }

  // Average -- divide by how many
  if (count > 0) {
    steer.div(count)
  }

  // As long as the vector is greater than 0
  if (steer.mag() > 0) {
    // Implement Reynolds: Steering = Desired - Velocity
    steer.normalize()
    steer.mult(this.maxspeed)
    steer.sub(this.velocity)
    steer.limit(this.maxforce)
  }
  return steer
}

// Alignment
// For every nearby boid in the system, calculate the average velocity
Boid.prototype.align = function (boids) {
  let neighbordist = 50
  let sum = createVector(0, 0)
  let count = 0
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position, boids[i].position)
    if (d > 0 && d < neighbordist) {
      sum.add(boids[i].velocity)
      count++
    }
  }
  if (count > 0) {
    sum.div(count)
    sum.normalize()
    sum.mult(this.maxspeed)
    let steer = p5.Vector.sub(sum, this.velocity)
    steer.limit(this.maxforce)
    return steer
  } else {
    return createVector(0, 0)
  }
}

// Cohesion
// For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
Boid.prototype.cohesion = function (boids) {
  let neighbordist = 1000
  let sum = createVector(0, 0) // Start with empty vector to accumulate all locations
  let count = 0
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position, boids[i].position)
    if (d > 0 && d < neighbordist) {
      sum.add(boids[i].position) // Add location
      count++
    }
  }
  if (count > 0) {
    sum.div(count)
    return this.seek(sum) // Steer towards the location
  } else {
    return createVector(0, 0)
  }
}
