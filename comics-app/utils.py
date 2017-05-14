from flask import abort, request, g
from functools import wraps
import cx_Oracle
import re
import collections


def execute_query(con, query, **kwargs):
    """ Execute a query and return corresponding data """
    # Execute query
    print(query)
    cur = con.cursor()
    cur.execute(query, kwargs)

    # Return data with description
    try:
        data = cur.fetchall()
    except:
        data = []

    return (extract_schema(cur.description), data)


def generic_search(con, keywords, tables):
    """ Perform a search in the given tables for containment of given keywords """
    # List of tuples (table_name, schema, tuples)
    result = []
    table_names = get_table_names(con)
    for table in tables:
        # Make sure user didn't cheat with table names
        if table not in table_names:
            raise ValueError('Invalid table name')

        # Build conditions
        conditions = []
        for col in get_column_names(con, table):
            conditions.append('{} LIKE \'%\'||:keywords||\'%\''.format(col))

        conditions = ' OR '.join(conditions)

        # Execute query
        query = 'SELECT * FROM {} WHERE {}'.format(table, conditions)
        (schema, data) = execute_query(con, query, keywords=keywords)

        if len(data) > 0:
            result.append((table, schema, data))

    return result


def extract_schema(description):
    """ Extract column names from cursor description """
    if not description:
        return []

    names = []
    for col in description:
        names.append(col[0])

    return names


def ajax(f):
    """ Custom decoractor to restrict acces to AJAX calls """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.is_xhr:
            return abort(401)
        return f(*args, **kwargs)
    return decorated_function


def get_db(app):
    """ Connect to the database and return connection """
    if not hasattr(g, 'db'):
        dsn_tns = cx_Oracle.makedsn(app.config['DB_SERVER'],
                                    app.config['DB_PORT'],
                                    app.config['DB_SID'])

        g.db = cx_Oracle.connect(app.config['DB_USER'],
                                 app.config['DB_PWD'],
                                 dsn_tns)

    return g.db


def get_queries(app, context):
    """ Parse, cache and return predefined queries """
    if 'queries' not in context:
        with open(app.config['QUERIES_PATH'], 'r') as fd:
            sqlFile = fd.read()

        # all SQL commands (split on ';')
        sqlCommands = sqlFile.split(';')
        context['queries'] = {}
        for command in sqlCommands:
            command = re.sub(r'\s*--\s*|\s*\n\s*', ' ', command)
            query = command.split(':')
            context['queries'][query[0]] = query[1]

    return context['queries']


def get_table_names(con):
    """ Return database tables names """
    query = 'SELECT table_name FROM user_tables'
    data = execute_query(con, query)[1]
    return list(map(lambda x: x[0], data))


def get_column_names(con, table):
    """ Return table column names """
    query = 'SELECT * FROM {} WHERE 1=0'.format(table)
    return execute_query(con, query)[0]


def create_dict_for_insert(con):
    """This function is used to create a dictionnary containing all the tables
    and there column that must appear in the UI as well as an indicator to which
    insert category it belong (1, 2 or 3)"""
    # create dict of dictionnary
    insert_dict = dict()
    tables = get_table_names(con)
    for table in tables:
        attributs = get_column_names(con, table)
        # check if there is an ID attribut meaning
        # that this table is not a relation
        if 'ID' not in attributs:
            continue
        insert_dict[table] = dict()
        for attribut in attributs:
            # skip the id attribut for it is not to the userv to set it
            if attribut == 'ID':
                continue
                # check if attribut name has ID in it meaning it is referencing
                # another table
            if 'ID' not in attribut:
                # clean and insert column name with insert indicator 1
                insert_dict[table][attribut] = {'case': 1}
            else:
                # clean and insert column name with insert indicator 2
                foreign_table = attribut.replace('_ID', '')
                if foreign_table == "REPRINT_NOTE":
                    foreign_table = "NOTE"
                insert_dict[table][attribut] = {
                    'case': 2,
                    'foreign_table': foreign_table
                }
        # go through tables and find elements where the names is
        # with type 3 inserts
        for table2 in tables:
            if table2 == 'FIRST_LAST_ISSUE':
                continue
            attributs2 = get_column_names(con, table2)
            if table + '_ID' == attributs2[0]:
                foreign_table = attributs2[1].replace('_ID', '')
                col_name = table2.split('_')[-1]
                insert_dict[table][col_name] = {
                    'case': 3,
                    'foreign_table': foreign_table,
                    'foreign_relation': table2
                }
    return insert_dict
