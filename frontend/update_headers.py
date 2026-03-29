import os

frontend_dir = 'c:/Users/JADU/Desktop/DBMS/university-dbms/frontend'
for f in os.listdir(frontend_dir):
    if f.endswith('.html') and f != 'login.html':
        path = os.path.join(frontend_dir, f)
        with open(path, 'r') as file:
            content = file.read()
        
        if 'js/app.js' not in content:
            content = content.replace('</head>', '    <script src="js/app.js"></script>\n</head>')
            with open(path, 'w') as file:
                file.write(content)
        
        if f == 'index.html':
            # Remove any duplicate app.js if there was
            pass

print("Done updating HTML headers")
