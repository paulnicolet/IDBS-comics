import cx_Oracle
import re


def get_db(app, context):
    """
    Connect to the database and return connection.
    """
    if not hasattr(context, 'db'):
        dsn_tns = cx_Oracle.makedsn(app.config['DB_SERVER'],
                                    app.config['DB_PORT'],
                                    app.config['DB_SID'])

        context.db = cx_Oracle.connect(app.config['DB_USER'],
                                       app.config['DB_PWD'],
                                       dsn_tns)

    return context.db


def get_queries(app, context):
    if not hasattr(context, 'queries'):
        with open(app.config['QUERIES_PATH'], 'r') as fd:
            sqlFile = fd.read()

        # all SQL commands (split on ';')
        sqlCommands = sqlFile.split(';')
        context.queries = {}
        for command in sqlCommands:
            command = re.sub(r'\s*--\s*|\s*\n\s*', ' ', command)
            query = command.split(':')
            context.queries[query[0]] = query[1]

    return context.queries


def shutdown(app, context):
    with app.app_context():
        get_db(app, context).close()
