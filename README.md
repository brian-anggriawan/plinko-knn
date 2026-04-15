# Plinko KNN

A Plinko physics simulation with a K-Nearest Neighbors (KNN) machine learning prediction feature.

**Live Demo:** https://plinko-j0uzkykzd-briananggriawan31-1198s-projects.vercel.app/

## Features

- Drop balls into a Plinko board and watch them fall into buckets
- Collect data across many drops
- **Predict Bucket** — enter a drop position and see the probability distribution of which bucket the ball will land in, powered by KNN

## How Prediction Works

The prediction uses KNN based on drop position. It finds all historical drops at similar positions and shows the empirical bucket distribution as percentages. When data is collected from only one position, all data points are used to give an accurate probability estimate.

## Tech Stack

- [Matter.js](https://brm.io/matter-js/) — physics engine
- [Lodash](https://lodash.com/) — data manipulation
- [Semantic UI](https://semantic-ui.com/) — styling
