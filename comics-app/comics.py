from flask import Flask, g, render_template, request, jsonify
from utils import get_db,get_queries
import os

app = Flask(__name__)

# Set app configuration
app.config.update({'DB_USER': os.environ['IDBS_USER'],
                   'DB_PWD': os.environ['IDBS_PWD'],
                   'DB_SERVER': 'diassrv2.epfl.ch',
                   'DB_PORT': 1521,
                   'DB_SID': 'orcldias',
                   'DEBUG': True,
                   'QUERIES_PATH': 'queries.sql'})

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
    return jsonify([('COLUMN1', 'COLUMN2', 'COLUMN3'),
                    ('tuple1_1', 'tuple1_2', 'tuple1_3'),
                    ('tuple2_1', 'tuple2_2', 'tuple2_3'),
                    ('tuple3_1', 'tuple3_2', 'tuple3_3')])

@app.route('/queries', methods=['GET', 'POST'])
def queries():
    if request.method == 'GET':
        return render_template('queries-form.html', queries=get_queries(app, g))

    query_key = request.form['query-selector']
    query = get_queries(app, g)[query_key]
    con = get_db(app, g)
    cur = con.cursor()
    cur.execute(query)
    data = cur.fetchall()
    names = []
    for descr in cur.description:
        names.append(descr[0])
    data.insert(0,names)
    return jsonify(data)

@app.route('/get_table_names', methods=['GET'])
def get_table_names():
    return jsonify(['Story', 'Issues', 'Series'])
