import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

let query = '';
let selectedYear = null;

function getFilteredProjects() {
  let filtered = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  if (selectedYear) {
    filtered = filtered.filter((project) => project.year === selectedYear);
  }

  return filtered;
}

function renderPieChart(projectsGiven) {
  const svg = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');

  svg.selectAll('*').remove();
  legend.selectAll('*').remove();

  let data = d3.rollups(
    projectsGiven,
    (values) => values.length,
    (d) => d.year,
  ).map(([year, count]) => ({
    value: count,
    label: year,
  }));

  data.sort((a, b) => d3.ascending(a.label, b.label));

  if (selectedYear && !data.some((d) => d.label === selectedYear)) {
    selectedYear = null;
  }

  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);

  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  arcData.forEach((arcDatum, index) => {
    svg.append('path')
      .attr('d', arcGenerator(arcDatum))
      .attr('fill', colors(index))
      .attr('class', arcDatum.data.label === selectedYear ? 'selected' : '')
      .on('click', () => {
        selectedYear = selectedYear === arcDatum.data.label ? null : arcDatum.data.label;
        updatePage();
      });
  });

  data.forEach((d, index) => {
    legend.append('li')
      .attr('style', `--color: ${colors(index)}`)
      .attr('class', d.label === selectedYear ? 'selected' : '')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        selectedYear = selectedYear === d.label ? null : d.label;
        updatePage();
      });
  });
}

function updatePage() {
  let filteredProjects = getFilteredProjects();

  renderProjects(filteredProjects, projectsContainer, 'h2');
  projectsTitle.textContent = `${filteredProjects.length} Projects`;
  renderPieChart(filteredProjects);
}

updatePage();

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  updatePage();
});