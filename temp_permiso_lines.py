from pathlib import Path
path=Path('backend/app/Http/Controllers/PermisoLicenciaController.php')
text=path.read_text(encoding='utf-8').splitlines()
for i,line in enumerate(text,1):
    if 220 <= i <= 320:
        print(f'{i:04d}: {line}')
