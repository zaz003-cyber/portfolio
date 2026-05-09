async function loadData() {
  const data = await d3.csv('loc.csv');
  console.log(data);
}

loadData();