const fs = require('fs');

function convertHtmlToJsx(filePath, outPath) {
  const html = fs.readFileSync(filePath, 'utf8');

  // Extract body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return;
  let innerHtml = bodyMatch[1];

  // class -> className
  innerHtml = innerHtml.replace(/class=/g, 'className=');

  // SVG attributes
  const svgAttributes = [
    'stroke-width', 'stroke-linecap', 'stroke-linejoin', 
    'fill-opacity', 'stop-color', 'stop-opacity'
  ];
  svgAttributes.forEach(attr => {
    const camelAttr = attr.replace(/-([a-z])/g, g => g[1].toUpperCase());
    innerHtml = innerHtml.replace(new RegExp(attr, 'g'), camelAttr);
  });
  innerHtml = innerHtml.replace(/viewbox/ig, 'viewBox');
  innerHtml = innerHtml.replace(/preserveaspectratio/ig, 'preserveAspectRatio');
  innerHtml = innerHtml.replace(/lineargradient/ig, 'linearGradient');
  
  // style="font-variation-settings: 'FILL' 1;"
  innerHtml = innerHtml.replace(/style="([^"]+)"/g, (match, p1) => {
    const props = p1.split(';').filter(Boolean).map(s => {
      let [key, ...valParts] = s.split(':');
      let val = valParts.join(':');
      if(!val) return '';
      key = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
      val = val.trim().replace(/'/g, '"');
      return `${key}: '${val}'`;
    }).filter(Boolean).join(', ');
    return `style={{${props}}}`;
  });

  // Self closing tags
  innerHtml = innerHtml.replace(/<input([^>]+?)>/g, '<input$1 />');
  innerHtml = innerHtml.replace(/<img([^>]+?)>/g, '<img$1 />');
  innerHtml = innerHtml.replace(/<br([^>]*?)>/g, '<br$1 />');
  innerHtml = innerHtml.replace(/<hr([^>]*?)>/g, '<hr$1 />');
  
  // Remove comments
  innerHtml = innerHtml.replace(/<!--[\s\S]*?-->/g, '');

  fs.writeFileSync(outPath, innerHtml);
  console.log(`Processed ${filePath} to ${outPath}`);
}

if (!fs.existsSync('scratch')) {
  fs.mkdirSync('scratch');
}

convertHtmlToJsx('stitch_screens/student_dashboard.html', 'scratch/student_dashboard.jsx');
convertHtmlToJsx('stitch_screens/admin___analyst_dashboard.html', 'scratch/admin_dashboard.jsx');
convertHtmlToJsx('stitch_screens/mentor_portal___live_proctoring_dashboard.html', 'scratch/mentor_dashboard.jsx');
convertHtmlToJsx('stitch_screens/adaptive_test_interface.html', 'scratch/adaptive_test.jsx');
convertHtmlToJsx('stitch_screens/manual_enrollment_form.html', 'scratch/auth_form.jsx');
