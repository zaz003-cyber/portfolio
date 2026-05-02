import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');

renderProjects(projects, projectsContainer, 'h2');

projectsTitle.textContent = `${projects.length} Projects`;

const svg = d3.select('#projects-pie-plot');

svg.selectAll('*').remove();

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

let arc = arcGenerator({
  startAngle: 0,
  endAngle: 2 * Math.PI,
});

svg.append('path')
  .attr('d', arc)
  .attr('fill', 'red');