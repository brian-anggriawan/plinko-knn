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

  // Use all 3 features: dropPosition, bounciness, size (same as knn training)
  // For prediction point: use inputted position + median bounciness + median size from data
  const sortedBounciness = _.sortBy(outputs.map((r) => r[1]));
  const sortedSize = _.sortBy(outputs.map((r) => r[2]));
  const medianBounciness =
    sortedBounciness[Math.floor(sortedBounciness.length / 2)];
  const medianSize = sortedSize[Math.floor(sortedSize.length / 2)];

  // k = sqrt of dataset size, min 10, max 100
  const k = Math.min(100, Math.max(10, Math.floor(Math.sqrt(outputs.length))));

  // Normalize all 3 features across the dataset + prediction point together
  const featureCount = 3;
  const rawData = outputs.map((row) => [row[0], row[1], row[2], row[3]]);
  const predictionRow = [dropPosition, medianBounciness, medianSize, null];

  const combined = [...rawData, predictionRow];
  const cloned = _.cloneDeep(combined);

  _.range(featureCount).forEach((fi) => {
    const vals = cloned.map((r) => r[fi]);
    const min = _.min(vals);
    const max = _.max(vals);
    cloned.forEach((r) => {
      r[fi] = max === min ? 0 : (r[fi] - min) / (max - min);
    });
  });

  const normalizedData = cloned.slice(0, rawData.length);
  const normalizedPoint = cloned[cloned.length - 1].slice(0, featureCount);

  const neighbors = _.chain(normalizedData)
    .map((row) => [
      distance(row.slice(0, featureCount), normalizedPoint),
      row[3],
    ])
    .sortBy((row) => row[0])
    .slice(0, k)
    .value();

  const bucketCounts = _.countBy(neighbors, (row) => row[1]);

  const resultsEl = document.querySelector("#prediction-results");
  let html = `<div class="prediction-title">Prediction Results <span style="font-weight:normal;font-size:11px;color:#888;">(k=${k}, features: position+bounciness+size)</span>:</div>`;

  for (let i = 1; i <= 10; i++) {
    const count = bucketCounts[i] || 0;
    const percent = Math.round((count / k) * 100);
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
