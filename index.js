import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

const projects = await fetchJSON('./lib/projects.json');

const latestProjects = d3
  .sort(projects, (a, b) => d3.descending(a.year, b.year))
  .slice(0, 3);

const projectsContainer = document.querySelector('.projects');

renderProjects(latestProjects, projectsContainer, 'h2');

const githubData = await fetchGitHubData('zaz003-cyber');
const profileStats = document.querySelector('#profile-stats');

if (profileStats && githubData) {
  profileStats.innerHTML = `
    <dl class="github-stats">
      <div>
        <dt>Public Repos</dt>
        <dd>${githubData.public_repos}</dd>
      </div>
      <div>
        <dt>Public Gists</dt>
        <dd>${githubData.public_gists}</dd>
      </div>
      <div>
        <dt>Followers</dt>
        <dd>${githubData.followers}</dd>
      </div>
      <div>
        <dt>Following</dt>
        <dd>${githubData.following}</dd>
      </div>
    </dl>
  `;
}