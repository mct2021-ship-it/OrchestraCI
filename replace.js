import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(/setPersonas=\{setPersonas\}/g, 'setPersonas={handleSetPersonas}');
content = content.replace(/setProjects=\{setProjects\}/g, 'setProjects={handleSetProjects}');
content = content.replace(/setJourneys=\{setJourneys\}/g, 'setJourneys={handleSetJourneys}');
content = content.replace(/setTasks=\{setTasks\}/g, 'setTasks={handleSetTasks}');
content = content.replace(/setProcessMaps=\{setProcessMaps\}/g, 'setProcessMaps={handleSetProcessMaps}');
content = content.replace(/setStoryboards=\{setStoryboards\}/g, 'setStoryboards={handleSetStoryboards}');
content = content.replace(/setProducts=\{setProducts\}/g, 'setProducts={handleSetProducts}');
content = content.replace(/setServices=\{setServices\}/g, 'setServices={handleSetServices}');

fs.writeFileSync('src/App.tsx', content);
