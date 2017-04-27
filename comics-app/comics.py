from flask import Flask, g, render_template, request, jsonify
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
def home():
    #con = get_db(app, g)
    return render_template('index.html')


@app.route('/search', methods=['GET', 'POST'])
def search():
    # If GET, return the form to render
    if request.method == 'GET':
        return render_template('search-form.html')

    # If POST, process the query and return data
    print(request.form)
    return jsonify([('COLUMN1', 'COLUMN2', 'COLUMN3'),
                    ('tuple1_1', 'tuple1_2', 'tuple1_3'),
                    ('tuple2_1', 'tuple2_2', 'tuple2_3'),
                    ('tuple3_1', 'tuple3_2', 'tuple3_3')])


@app.route('/get_table_names', methods=['GET'])
def get_table_names():
    return jsonify(['Story', 'Issues', 'Series'])
