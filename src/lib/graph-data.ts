import { getAllArticles, getHubFiles } from './content';

export interface GraphNode {
  id: string;
  name: string;
  val: number;
  color: string;
  group: string;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

function getColorForTag(tag: string): string {
  // Simple deterministic color generation based on tag
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = Math.floor(Math.abs((Math.sin(hash) * 10000) % 1 * 16777215)).toString(16);
  return '#' + '000000'.substring(0, 6 - color.length) + color;
}

export function getGraphData(): GraphData {
  const articles = getAllArticles();
  const hubFiles = getHubFiles();
  
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  
  // First pass: create all article nodes
  articles.forEach(article => {
    const primaryTag = article.frontmatter.tags[0] || 'Uncategorized';
    nodes.push({
      id: article.id,
      name: `${article.frontmatter.title_th} | ${article.frontmatter.title_en}`,
      val: 2, // size
      color: getColorForTag(primaryTag),
      group: primaryTag,
    });
  });

  // Create hub nodes
  hubFiles.forEach(hub => {
    nodes.push({
      id: `hub-${hub}`,
      name: hub,
      val: 4, // bigger size for hubs
      color: '#C8A882', // ACCENT
      group: 'hub',
    });
  });
  
  // Second pass: create links
  articles.forEach(article => {
    // 1. Link to its own tags if they match a hub
    article.frontmatter.tags.forEach(tag => {
      if (hubFiles.includes(tag) || hubFiles.includes(tag.toLowerCase())) {
        links.push({
          source: article.id,
          target: `hub-${tag}`
        });
        const hubNode = nodes.find(n => n.id === `hub-${tag}`);
        if (hubNode) hubNode.val += 0.5;
      }
    });

    // 2. Find wiki links in content
    const content = article.content;
    const linkRegex = /\[\[(.*?)\]\]/g;
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      const linkedTitle = match[1].trim();
      
      // Try to find the target article
      const targetArticle = articles.find(a => 
        a.frontmatter.title_th === linkedTitle || 
        a.frontmatter.title_en === linkedTitle ||
        a.id === linkedTitle
      );
      
      if (targetArticle && targetArticle.id !== article.id) {
        // avoid duplicates
        const existingLink = links.find(l => 
          (l.source === article.id && l.target === targetArticle.id) ||
          (l.source === targetArticle.id && l.target === article.id)
        );
        
        if (!existingLink) {
          links.push({
            source: article.id,
            target: targetArticle.id
          });
          
          // Increase node value (size) based on connections
          const sourceNode = nodes.find(n => n.id === article.id);
          const targetNode = nodes.find(n => n.id === targetArticle.id);
          if (sourceNode) sourceNode.val += 0.5;
          if (targetNode) targetNode.val += 0.5;
        }
      } else if (hubFiles.includes(linkedTitle)) {
        // Link to hub if it matches
        const existingLink = links.find(l => 
          (l.source === article.id && l.target === `hub-${linkedTitle}`) ||
          (l.source === `hub-${linkedTitle}` && l.target === article.id)
        );
        
        if (!existingLink) {
          links.push({
            source: article.id,
            target: `hub-${linkedTitle}`
          });
          const hubNode = nodes.find(n => n.id === `hub-${linkedTitle}`);
          if (hubNode) hubNode.val += 0.5;
        }
      }
    }
  });
  
  return { nodes, links };
}
