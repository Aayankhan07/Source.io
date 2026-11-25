# Newtonian Mechanics: Forces, Motion, Momentum, and Energy

## Introduction

Classical mechanics is the branch of physics that describes how objects move when forces act on them. Its foundations were set out by Isaac Newton in the Principia, published in 1687, building on earlier work by Galileo Galilei on falling bodies and inclined planes and by Johannes Kepler on planetary orbits. Newtonian mechanics remains accurate for everyday objects moving at speeds far below the speed of light and larger than atoms. Bridges, cars, rockets leaving the launch pad, and baseballs in flight are all analyzed with the ideas in this handout.

The key quantities are position, velocity, and acceleration. Velocity is the rate of change of position and is a vector, meaning it has both a magnitude (speed) and a direction. Acceleration is the rate of change of velocity, measured in meters per second squared (m/s²). An object can accelerate by speeding up, slowing down, or changing direction, which is why a car going around a curve at constant speed is still accelerating.

## Newton's First Law: Inertia

Newton's first law states that an object at rest stays at rest, and an object in motion keeps moving in a straight line at constant speed, unless a net external force acts on it. This tendency to resist changes in motion is called inertia, and the measure of an object's inertia is its mass, measured in kilograms (kg).

The first law overturned the older Aristotelian view that a moving object naturally comes to rest. Galileo argued, using his rolling-ball experiments, that a ball on a perfectly smooth horizontal surface would roll forever. Objects in daily life stop because of friction and air resistance, not because motion naturally fades.

A reference frame in which the first law holds is called an inertial reference frame. The surface of the Earth is approximately inertial for most laboratory problems, although its rotation produces small effects such as the Coriolis deflection of large-scale winds.

Everyday example: when a bus brakes suddenly, standing passengers lurch forward. No force pushes them forward; their bodies simply continue moving at the original speed while the bus slows beneath them.

## Newton's Second Law: Force and Acceleration

The second law gives the quantitative link between force and motion: the net force on an object equals its mass times its acceleration, written F = ma. Force is measured in newtons (N), where one newton is the force needed to accelerate a 1 kg mass at 1 m/s². In symbols, 1 N = 1 kg·m/s².

Several points deserve emphasis:

- The force in F = ma is the **net** force, the vector sum of all forces acting on the object.
- The acceleration points in the same direction as the net force.
- For a fixed force, doubling the mass halves the acceleration.

### Weight and Mass

Weight is the gravitational force on an object, given by W = mg, where g is the acceleration due to gravity, about 9.8 m/s² near Earth's surface. A 70 kg person therefore weighs about 686 N on Earth. On the Moon, where surface gravity is roughly 1.62 m/s², the same person would weigh about 113 N while their mass stays 70 kg. Mass is an intrinsic property; weight depends on location.

### Free-Body Diagrams

Solving mechanics problems usually starts with a free-body diagram: a sketch of the object alone with an arrow for every force acting on it. Common forces include gravity (weight), the normal force from a surface, tension in ropes or cables, applied pushes or pulls, friction, and air drag. The normal force acts perpendicular to the contact surface; on a flat horizontal floor with no other vertical forces, it equals the object's weight.

## Newton's Third Law: Action and Reaction

The third law states that whenever object A exerts a force on object B, object B exerts a force on object A that is equal in magnitude and opposite in direction. These two forces form an action-reaction pair.

The crucial detail is that the paired forces act on **different** objects, so they never cancel each other in a single free-body diagram. When you push against a wall, the wall pushes back on your hands with equal force. When a swimmer pushes water backward, the water pushes the swimmer forward. A rocket expels exhaust gas downward at high speed, and the gas pushes the rocket upward; this is why rockets work in the vacuum of space, where there is no air to push against.

A common confusion involves a book resting on a table. The book's weight and the normal force from the table are equal and opposite, but they are not a third-law pair, because both act on the book. The true third-law partner of the book's weight is the book's gravitational pull on the Earth.

## Friction

Friction is a contact force that opposes the relative sliding (or attempted sliding) of two surfaces. It arises from microscopic interactions between surface irregularities and from molecular adhesion.

### Static and Kinetic Friction

Static friction acts when surfaces are not sliding relative to each other. It adjusts to match the applied force up to a maximum value given by f_s,max = μ_s N, where μ_s is the coefficient of static friction and N is the normal force. Once the applied force exceeds that maximum, the object begins to slide.

Kinetic friction acts while surfaces are sliding, with magnitude f_k = μ_k N. For most pairs of materials, the coefficient of kinetic friction is smaller than the coefficient of static friction, which is why it takes more effort to start pushing a heavy box than to keep it moving.

Typical approximate coefficients:

| Surfaces | μ_s | μ_k |
|---|---|---|
| Rubber on dry concrete | 1.0 | 0.8 |
| Steel on steel (dry) | 0.74 | 0.57 |
| Wood on wood | 0.5 | 0.3 |
| Ice on ice | 0.1 | 0.03 |

Friction coefficients are dimensionless and, to a good approximation, do not depend on the contact area. Anti-lock braking systems exploit the difference between static and kinetic friction: by keeping the tires rolling rather than skidding, they use static friction between tire and road, which provides greater stopping force and preserves steering control.

## Momentum and Impulse

Linear momentum is defined as mass times velocity, p = mv, and is measured in kilogram meters per second (kg·m/s). Momentum is a vector pointing in the direction of motion. A 1,500 kg car moving at 20 m/s has a momentum of 30,000 kg·m/s.

Newton originally expressed his second law in terms of momentum: the net force equals the rate of change of momentum. Rearranging gives the impulse-momentum theorem: the impulse delivered to an object, J = FΔt (force multiplied by the time interval over which it acts), equals the change in its momentum, Δp.

This theorem explains many safety designs. Airbags, crumple zones, padded gym mats, and bending your knees when landing from a jump all increase the time over which a collision occurs. For the same change in momentum, a longer stopping time means a smaller average force on the body.

### Conservation of Momentum

When no net external force acts on a system, its total momentum stays constant. This law of conservation of momentum follows directly from Newton's third law: internal forces between parts of the system come in equal and opposite pairs, so their impulses cancel.

Collisions are classified by what happens to kinetic energy:

- In an **elastic collision**, both momentum and kinetic energy are conserved. Collisions between billiard balls are nearly elastic.
- In an **inelastic collision**, momentum is conserved but some kinetic energy is converted to heat, sound, or deformation.
- In a **perfectly inelastic collision**, the objects stick together and move with a common velocity afterward; this case loses the maximum kinetic energy allowed by momentum conservation.

Recoil is another example. When a 4 kg rifle fires a 0.01 kg bullet at 400 m/s, the total momentum before firing is zero, so the rifle recoils backward at 0.01 × 400 / 4 = 1 m/s.

## Work and Energy

### Work

In physics, work is done when a force moves an object through a displacement. For a constant force, work equals force times displacement times the cosine of the angle between them: W = Fd cos θ. Work is measured in joules (J), where 1 J = 1 N·m. A force perpendicular to the motion does no work, so the normal force on a box sliding across a level floor does zero work, and the gravitational pull on a satellite in a perfectly circular orbit does no work over its path.

### Kinetic and Potential Energy

Kinetic energy is the energy of motion: KE = ½mv². Because speed is squared, doubling a car's speed quadruples its kinetic energy, which is one reason braking distances grow so quickly at higher speeds.

Gravitational potential energy near Earth's surface is PE = mgh, where h is height above a chosen reference level. Lifting a 2 kg book 1.5 m onto a shelf stores about 2 × 9.8 × 1.5 ≈ 29.4 J of potential energy.

Elastic potential energy stored in a stretched or compressed spring is ½kx², where k is the spring constant and x is the displacement from the relaxed length. Hooke's law describes the spring force itself as F = −kx.

### The Work-Energy Theorem

The work-energy theorem states that the net work done on an object equals the change in its kinetic energy: W_net = ΔKE. This gives an alternative to F = ma for problems where forces act over distances rather than times.

### Conservation of Mechanical Energy

When only conservative forces such as gravity and ideal springs do work, the total mechanical energy (KE + PE) remains constant. A roller coaster trades potential energy at the top of a hill for kinetic energy at the bottom. Friction is a non-conservative force: it converts mechanical energy into thermal energy, so the coaster never quite reaches its starting height again without a motor.

### Power

Power is the rate of doing work, P = W/t, measured in watts (W), where 1 W = 1 J/s. One horsepower equals about 746 watts. A 60 kg climber who ascends 10 m of stairs in 12 seconds develops a power output of about 60 × 9.8 × 10 / 12 ≈ 490 W.

## Worked Examples

### Example 1: Pushing a Crate

A 50 kg crate sits on a level floor with μ_s = 0.4 and μ_k = 0.3. How much horizontal force is needed to start it moving, and what is its acceleration if a 200 N push is maintained?

The normal force is N = mg = 50 × 9.8 = 490 N. Maximum static friction is 0.4 × 490 = 196 N, so a push slightly greater than 196 N starts the crate sliding. Once it moves, kinetic friction is 0.3 × 490 = 147 N. With a 200 N push, the net force is 200 − 147 = 53 N, and the acceleration is 53 / 50 = 1.06 m/s².

### Example 2: A Dropped Ball

A 0.5 kg ball is dropped from a height of 20 m. Ignoring air resistance, what is its speed just before it hits the ground?

Using energy conservation, mgh = ½mv², so the mass cancels and v = √(2gh) = √(2 × 9.8 × 20) ≈ 19.8 m/s. The fact that mass cancels illustrates Galileo's insight that, without air resistance, all objects fall with the same acceleration.

### Example 3: A Perfectly Inelastic Collision

A 1,000 kg car moving at 15 m/s rear-ends a stationary 1,500 kg car, and the two lock bumpers. What is their common speed?

Total momentum before is 1,000 × 15 = 15,000 kg·m/s. Afterward, the combined 2,500 kg mass moves at 15,000 / 2,500 = 6 m/s. Kinetic energy before was ½ × 1,000 × 15² = 112,500 J; afterward it is ½ × 2,500 × 6² = 45,000 J. So 67,500 J, or 60 percent of the original kinetic energy, went into deformation, heat, and sound.

### Example 4: Catching an Egg

An egg of mass 0.06 kg falling at 5 m/s is caught. If a stiff hand stops it in 0.01 s, the average force is 0.06 × 5 / 0.01 = 30 N, likely enough to break the shell. If a soft hand that moves with the egg stops it over 0.2 s, the force drops to 1.5 N. The impulse is the same in both cases; only the time differs.

## Limits of Newtonian Mechanics

Newton's laws break down in two regimes. At speeds approaching the speed of light (about 3 × 10⁸ m/s), Einstein's special relativity, published in 1905, is required. At atomic and subatomic scales, quantum mechanics replaces classical trajectories with probabilities. Strong gravitational fields, such as near black holes, require general relativity. For engineering, sports, and everyday motion, however, Newton's three laws remain the working tools of choice.

## Summary

- First law: objects keep their state of motion unless a net force acts; mass measures inertia.
- Second law: F = ma, with force in newtons.
- Third law: forces come in equal and opposite pairs acting on different objects.
- Friction: static friction is usually stronger than kinetic friction.
- Momentum p = mv is conserved in isolated systems; impulse equals change in momentum.
- Work W = Fd cos θ changes kinetic energy; mechanical energy is conserved when only conservative forces act.
