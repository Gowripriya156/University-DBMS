import os

sql_file = 'c:/Users/JADU/Desktop/DBMS/university-dbms/database/07_triggers.sql'
with open(sql_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Regular expression to find CREATE TRIGGER and insert DROP TRIGGER IF EXISTS
import re

# We find "CREATE TRIGGER <name>" and replace with "DROP TRIGGER IF EXISTS <name>;\nCREATE TRIGGER <name>"
new_content = re.sub(r'CREATE TRIGGER (\w+)', r'DROP TRIGGER IF EXISTS \1;\nCREATE TRIGGER \1', content)

with open(sql_file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated 07_triggers.sql with DROP TRIGGER IF EXISTS")
