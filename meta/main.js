async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;

      let ret = {
        id: commit,
        url: 'https://github.com/zaz003-cyber/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false,
        writable: false,
        configurable: false,
      });

      return ret;
    });
}

let data = await loadData();
let commits = processCommits(data);

console.log(commits);

function displayStats(data, commits) {
  const stats = document.querySelector('#stats');

  const files = d3.groups(data, (d) => d.file);
  const maxDepth = d3.max(data, (d) => d.depth);
  const longestFile = d3.greatest(files, ([, lines]) => lines.length);

  stats.innerHTML = `
  <div>
    <dt>Total lines</dt>
    <dd>${data.length}</dd>
  </div>

  <div>
    <dt>Total commits</dt>
    <dd>${commits.length}</dd>
  </div>

  <div>
    <dt>Total files</dt>
    <dd>${files.length}</dd>
  </div>

  <div>
    <dt>Max depth</dt>
    <dd>${maxDepth}</dd>
  </div>

  <div>
    <dt>Longest file</dt>
    <dd>${longestFile[0]} (${longestFile[1].length} lines)</dd>
  </div>
  `;
}

displayStats(data, commits);

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();

  const yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([height, 0]);

  const dots = svg.append('g').attr('class', 'dots');

  dots
    .selectAll('circle')
    .data(commits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', 5)
    .attr('fill', 'steelblue');
}

renderScatterPlot(data, commits);