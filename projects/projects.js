import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');

renderProjects(projects, projectsContainer, 'h2');

projectsTitle.textContent = `${projects.length} Projects`;

const svg = d3.select('#projects-pie-plot');

svg.selectAll('*').remove();

let data = [1, 2];

let total = 0;
for (let d of data) {
  total += d;
}

let angle = 0;
let arcData = [];

for (let d of data) {
  let endAngle = angle + (d / total) * 2 * Math.PI;
  arcData.push({ startAngle: angle, endAngle });
  angle = endAngle;
}

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let arcs = arcData.map((d) => arcGenerator(d));

let colors = ['red', 'orange'];

arcs.forEach((arc, index) => {
  svg.append('path')
    .attr('d', arc)
    .attr('fill', colors[index]);
});