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

let brushSelection = null;
let selectedCommits = [];

function renderSelectionCount() {
  const countElement = document.querySelector('#selection-count');

  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;
}

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

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;

  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });

  time.textContent = commit.datetime?.toLocaleString('en', {
    timeStyle: 'short',
  });

  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');

  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  const padding = 12;

  let left = event.clientX + padding;
  let top = event.clientY + padding;

  if (left + tooltipWidth > window.innerWidth) {
    left = event.clientX - tooltipWidth - padding;
  }

  if (top + tooltipHeight > window.innerHeight) {
    top = event.clientY - tooltipHeight - padding;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function createBrushSelector(svg, xScale, yScale) {
  svg.call(
    d3.brush()
      .on('start brush end', (event) => {
        brushSelection = event.selection;

        selectedCommits = brushSelection
          ? commits.filter((d) => {
              const x = xScale(d.datetime);
              const y = yScale(d.hourFrac);

              const [[x0, y0], [x1, y1]] = brushSelection;

              return x >= x0 && x <= x1 && y >= y0 && y <= y1;
            })
          : [];

        d3.selectAll('circle')
          .classed('selected', (d) => selectedCommits.includes(d));

        renderSelectionCount();
      })
  );

  svg.selectAll('.dots, .overlay ~ *').raise();
}

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 35 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  const yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  const xAxis = d3.axisBottom(xScale);

  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(
        d3.axisLeft(yScale)
        .tickFormat('')
        .tickSize(-usableArea.width)
    );
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);
     
  const rScale = d3
    .scaleSqrt()
    .domain(d3.extent(commits, (d) => d.totalLines))
    .range([4, 18]);
    
  const dots = svg.append('g').attr('class', 'dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .attr('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
    })
    .on('mousemove', (event) => {
        updateTooltipPosition(event);
    })
    .on('mouseleave', () => {
        updateTooltipVisibility(false);
    });

  createBrushSelector(svg, xScale, yScale);
}

renderScatterPlot(data, commits);