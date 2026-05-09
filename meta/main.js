async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    datetime: new Date(row.datetime),
  }));

  console.log(data);
  //console.log(data[0].datetime);
  //console.log(data[0].datetime instanceof Date);
}

loadData();