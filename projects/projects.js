import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');

renderProjects(projects, projectsContainer, 'h2');

projectsTitle.textContent = `${projects.length} Projects`;

const svg = d3.select('#projects-pie-plot');

svg.selectAll('*').remove();

let data = d3.rollups(
  projects,
  (values) => values.length,
  (d) => d.year
).map(([year, count]) => ({
  value: count,
  label: year,
}));

data.sort((a, b) => d3.ascending(a.label, b.label));

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

let sliceGenerator = d3.pie();
let arcData = sliceGenerator(data.map((d) => d.value));
let arcs = arcData.map((d) => arcGenerator(d));

let colors = d3.scaleOrdinal(d3.schemeTableau10);

arcs.forEach((arc, index) => {
  svg.append('path')
    .attr('d', arc)
    .attr('fill', colors(index));
});

const legend = d3.select('.legend');

legend.selectAll('*').remove();

data.forEach((d, index) => {
  legend.append('li')
    .attr('style', `--color: ${colors(index)}`)
    .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
});