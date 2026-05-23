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

const data = await loadData();
const commits = d3.sort(processCommits(data), (d) => d.datetime);

const fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);

const timeScale = d3
  .scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);

let commitProgress = 100;
let commitMaxTime = timeScale.invert(commitProgress);
let filteredCommits = commits;
let selectedCommits = [];

const WIDTH = 1000;
const HEIGHT = 600;
const MARGIN = { top: 10, right: 10, bottom: 30, left: 35 };
const USABLE = {
  top: MARGIN.top,
  right: WIDTH - MARGIN.right,
  bottom: HEIGHT - MARGIN.bottom,
  left: MARGIN.left,
  width: WIDTH - MARGIN.left - MARGIN.right,
  height: HEIGHT - MARGIN.top - MARGIN.bottom,
};

const yScale = d3
  .scaleLinear()
  .domain([-1, 24])
  .range([USABLE.bottom, USABLE.top]);

let xScale = d3.scaleTime().range([USABLE.left, USABLE.right]);

function renderSelectionCount() {
  document.querySelector('#selection-count').textContent =
    `${selectedCommits.length || 'No'} commits selected`;
}

function renderLanguageBreakdown() {
  const container = document.querySelector('#language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }

  const selectedLines = selectedCommits.flatMap((commit) => commit.lines);
  const breakdown = d3.rollups(
    selectedLines,
    (lines) => lines.length,
    (d) => d.type
  );

  container.innerHTML = '';
  for (const [type, count] of breakdown) {
    const proportion = count / selectedLines.length;
    container.innerHTML += `
      <div>
        <dt>${type}</dt>
        <dd>${count} lines (${d3.format('.1%')(proportion)})</dd>
      </div>
    `;
  }
}

function displayStats(data, commits) {
  const stats = document.querySelector('#stats');
  const files = d3.groups(data, (d) => d.file);
  const maxDepth = d3.max(data, (d) => d.depth);
  const longestFile = d3.greatest(files, ([, lines]) => lines.length);

  stats.innerHTML = `
    <div><dt>Total lines</dt><dd>${data.length}</dd></div>
    <div><dt>Total commits</dt><dd>${commits.length}</dd></div>
    <div><dt>Total files</dt><dd>${files.length}</dd></div>
    <div><dt>Max depth</dt><dd>${maxDepth}</dd></div>
    <div><dt>Longest file</dt><dd>${longestFile[0]} (${longestFile[1].length} lines)</dd></div>
  `;
}

function renderTooltipContent(commit) {
  if (Object.keys(commit).length === 0) return;

  const link = document.getElementById('commit-link');
  link.href = commit.url;
  link.textContent = commit.id;

  document.getElementById('commit-date').textContent =
    commit.datetime?.toLocaleString('en', { dateStyle: 'full' });
  document.getElementById('commit-tooltip-time').textContent =
    commit.datetime?.toLocaleString('en', { timeStyle: 'short' });
  document.getElementById('commit-author').textContent = commit.author;
  document.getElementById('commit-lines').textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  document.getElementById('commit-tooltip').hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  const padding = 12;

  let left = event.clientX + padding;
  let top = event.clientY + padding;

  if (left + tooltip.offsetWidth > window.innerWidth) {
    left = event.clientX - tooltip.offsetWidth - padding;
  }
  if (top + tooltip.offsetHeight > window.innerHeight) {
    top = event.clientY - tooltip.offsetHeight - padding;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function attachDotHandlers(selection) {
  selection
    .on('mouseenter', (event, commit) => {
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', updateTooltipPosition)
    .on('mouseleave', () => updateTooltipVisibility(false));
}

function initScatterPlot() {
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
    .style('overflow', 'visible');

  svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${USABLE.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-USABLE.width));

  svg
    .append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${USABLE.left}, 0)`)
    .call(
      d3
        .axisLeft(yScale)
        .tickValues(d3.range(0, 25, 2))
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00')
    );

  svg
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${USABLE.bottom})`);

  svg.append('g').attr('class', 'dots');

  const brushPadding = 35;
  svg.call(
    d3
      .brush()
      .extent([
        [USABLE.left, USABLE.top],
        [USABLE.right + brushPadding, USABLE.bottom],
      ])
      .on('start brush end', (event) => {
        const selection = event.selection;

        selectedCommits = selection
          ? filteredCommits.filter((d) => {
              const x = xScale(d.datetime);
              const y = yScale(d.hourFrac);
              const [[x0, y0], [x1, y1]] = selection;
              return x >= x0 && x <= x1 && y >= y0 && y <= y1;
            })
          : [];

        d3.selectAll('#chart circle').classed('selected', (d) =>
          selectedCommits.includes(d)
        );

        renderSelectionCount();
        renderLanguageBreakdown();
      })
  );

  svg.selectAll('.dots, .overlay ~ *').raise();
}

function updateScatterPlot(commits) {
  xScale = xScale.domain(d3.extent(commits, (d) => d.datetime)).nice();

  const svg = d3.select('#chart').select('svg');

  svg
    .select('g.x-axis')
    .call(d3.axisBottom(xScale).ticks(8).tickFormat(d3.timeFormat('%b %d')));

  const rScale = d3
    .scaleSqrt()
    .domain(d3.extent(commits, (d) => d.totalLines))
    .range([4, 18]);

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  svg
    .select('g.dots')
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .attr('fill-opacity', 0.7)
    .call(attachDotHandlers);
}

function updateFileDisplay(commits) {
  const lines = commits.flatMap((d) => d.lines);

  const files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length);

  const filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, (d) => d.name)
    .join((enter) =>
      enter.append('div').call((div) => {
        div.append('dt');
        div.append('dd');
      })
    );

  filesContainer
    .select('dt')
    .html(
      (d) => `<code>${d.name}</code><small>${d.lines.length} lines</small>`
    );

  filesContainer
    .select('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .join('div')
    .attr('class', 'loc')
    .attr('style', (d) => `--color: ${fileTypeColors(d.type)}`);
}

function updateByProgress(progress) {
  commitProgress = progress;
  commitMaxTime = timeScale.invert(commitProgress);
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

  document.querySelector('#commit-progress').value = commitProgress;
  document.querySelector('#commit-time').textContent =
    commitMaxTime.toLocaleString('en', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

  updateScatterPlot(filteredCommits);
  updateFileDisplay(filteredCommits);
}

displayStats(data, commits);
initScatterPlot();
updateByProgress(100);

document
  .querySelector('#commit-progress')
  .addEventListener('input', (e) => updateByProgress(Number(e.target.value)));
