from fileinput import filename
from pathlib import Path
from datetime import datetime
from random import randint


def logfile(dir, name):
    filename = '%s_%s_%s.log' % (
        name,
        datetime.now().strftime('%Y%m%d_%H%M%S'),
        ''.join(str(randint(0, 9)) for _ in range(4)),
    )
    path = Path(dir, filename)
    path.parent.mkdir(parents=True, exist_ok=True)
    return open(path, 'w')
