const outputs = [];

function distance(pointA, pointB) {
  return (
    _.chain(pointA)
      .zip(pointB)
      .map(([a, b]) => (a - b) ** 2)
      .sum()
      .value() ** 0.5
  );
}

function onScoreUpdate(dropPosition, bounciness, size, bucketLabel) {
  outputs.push([dropPosition, bounciness, size, bucketLabel]);
}

function runAnalysis() {
  const testSetSize = 100;
  const k = 10;

  _.range(0, 3).forEach((feature) => {
    const data = _.map(outputs, (row) => [row[feature], _.last(row)]);
    const [testData, trainingData] = splitData(minMax(data, 1), testSetSize);
    const accuracy = _.chain(testData)
      .filter(
        (testPoint) =>
          knn(trainingData, _.initial(testPoint), k) === _.last(testPoint),
      )
      .size()
      .divide(testSetSize)
      .value();

    console.log("Feature =", feature, "Accuracy:", accuracy);
  });
}

function knn(dataSet, predictionPoint, kNumber = 10) {
  return _.chain(dataSet)
    .map((row) => {
      return [distance(_.initial(row), predictionPoint), _.last(row)];
    })
    .sortBy((row) => row[0])
    .slice(0, kNumber)
    .countBy((row) => row[1])
    .toPairs()
    .sortBy((row) => row[1])
    .last()
    .first()
    .parseInt()
    .value();
}

function splitData(data, testCount) {
  const shuffled = _.shuffle(data);
  const testData = _.slice(shuffled, 0, testCount);
  const trainingData = _.slice(shuffled, testCount);

  return [testData, trainingData];
}

function minMax(data, featureCount) {
  const clonedData = _.cloneDeep(data);
  const featureRanges = [];

  _.range(featureCount).forEach((featureIndex) => {
    const featureValues = clonedData.map((row) => row[featureIndex]);
    const min = _.min(featureValues);
    const max = _.max(featureValues);
    featureRanges.push({ min, max });

    clonedData.forEach((row) => {
      row[featureIndex] = (row[featureIndex] - min) / (max - min);
    });
  });
  return clonedData;
}

function runPrediction() {
  if (outputs.length < 5) {
    document.querySelector("#prediction-results").innerHTML =
      '<div class="prediction-empty">Need at least 5 data points. Drop more balls first!</div>';
    return;
  }

  const dropPosition = parseFloat(
    document.querySelector("#predict-position").value,
  );
  if (isNaN(dropPosition) || dropPosition < 0 || dropPosition > 794) {
    document.querySelector("#prediction-results").innerHTML =
      '<div class="prediction-empty">Please enter a valid drop position (0 to 794).</div>';
    return;
  }

  // Use only drop position as feature (the only thing the user controls).
  // Bounciness and size are random — averaging over them by using position only
  // gives the true empirical probability for a given drop position.
  const positions = outputs.map((r) => r[0]);
  const posMin = _.min(positions);
  const posMax = _.max(positions);
  const normalize = (x) =>
    posMax === posMin ? 0 : (x - posMin) / (posMax - posMin);

  const normalizedPoint = normalize(dropPosition);

  // Compute absolute distance for each data point
  const withDistances = outputs.map((row) => [
    Math.abs(normalize(row[0]) - normalizedPoint),
    row[3],
  ]);

  const sorted = _.sortBy(withDistances, (r) => r[0]);

  // Base k = sqrt(n), but include ALL ties at the threshold distance
  // so equal-position balls are never partially sampled
  const baseK = Math.min(
    outputs.length,
    Math.max(50, Math.floor(Math.sqrt(outputs.length))),
  );
  const threshold = sorted[baseK - 1][0];
  const neighbors = sorted.filter((r) => r[0] <= threshold);

  const total = neighbors.length;
  const bucketCounts = _.countBy(neighbors, (r) => r[1]);

  const resultsEl = document.querySelector("#prediction-results");
  let html = `<div class="prediction-title">Prediction Results <span style="font-weight:normal;font-size:11px;color:#888;">(n=${total} neighbors)</span>:</div>`;

  for (let i = 1; i <= 10; i++) {
    const count = bucketCounts[i] || 0;
    const percent = Math.round((count / total) * 100);
    html += `
      <div class="prediction-item">
        <span class="prediction-bucket">Bucket #${i}</span>
        <div class="prediction-bar-wrap">
          <div class="prediction-bar" style="width:${percent}%"></div>
        </div>
        <span class="prediction-percent">${percent}%</span>
      </div>`;
  }

  resultsEl.innerHTML = html;
}
