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
