import cx_Oracle

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
        with open(app['QUERIES_PATH'],'r') as fd:
            sqlFile = fd.read()

        # all SQL commands (split on ';')
        sqlCommands = sqlFile.split(';')
        context.queries = {}
        for command in sqlCommands:
            query = command.split(':')
            context.queries[query[0].replace(r'\s--\s','')] = query[1]
    return context.queries
