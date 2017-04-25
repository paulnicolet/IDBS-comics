from flask import Flask, g, render_template
from utils import get_db
import os

app = Flask(__name__)

# Set app configuration
app.config.update({'DB_USER': os.environ['IDBS_USER'],
                   'DB_PWD': os.environ['IDBS_PWD'],
                   'DB_SERVER': 'diassrv2.epfl.ch',
                   'DB_PORT': 1521,
                   'DB_SID': 'orcldias',
                   'DEBUG': True})


@app.route('/')
def hello_world():
    #con = get_db(app, g)
    return render_template('index.html')
