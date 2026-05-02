import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

let query = '';
let selectedIndex = -1;

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

  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  let arcs = arcData.map((d) => arcGenerator(d));

  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  arcs.forEach((arc, index) => {
    svg.append('path')
      .attr('d', arc)
      .attr('fill', colors(index))
      .attr('class', index === selectedIndex ? 'selected' : '')
      .on('click', () => {
        selectedIndex = selectedIndex === index ? -1 : index;
        
        svg.selectAll('path')
          .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');
        
        legend.selectAll('li')
          .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');
    });
});

  data.forEach((d, index) => {
    legend.append('li')
      .attr('style', `--color: ${colors(index)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

let filteredProjects = projects.filter((project) => {
  let values = Object.values(project).join('\n').toLowerCase();
  return values.includes(query.toLowerCase());
});

renderProjects(filteredProjects, projectsContainer, 'h2');
projectsTitle.textContent = `${filteredProjects.length} Projects`;
renderPieChart(filteredProjects);

searchInput.addEventListener('input', (event) => {
  query = event.target.value;

  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  renderProjects(filteredProjects, projectsContainer, 'h2');
  projectsTitle.textContent = `${filteredProjects.length} Projects`;
  renderPieChart(filteredProjects);
});