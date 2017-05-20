from flask import abort, request, g
from functools import wraps
import cx_Oracle
import re
import collections


def execute_query(con, query, insert_tuple=None, **kwargs):
    """ Execute a query and return corresponding data """
    # Execute query
    # print(kwargs)
    # print(query)
    cur = con.cursor()

    if insert_tuple:
        cur.execute(query, insert_tuple)
    else:
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


def get_table_names(con, deletable=False):
    """ Return database tables names """
    query = 'SELECT table_name FROM user_tables'
    data = execute_query(con, query)[1]
    table_names = list(map(lambda x: x[0], data))

    if deletable:
        table_names = [
            x for x in table_names if 'ID' in get_column_names(con, x)]

    return table_names


def get_column_names(con, table):
    """ Return table column names """
    query = 'SELECT * FROM {} WHERE 1=0'.format(table)
    return execute_query(con, query)[0]


def get_column_nullable(con, table):
    """ This function is used to return the null condition for all columns of a table"""
    query = 'SELECT * FROM {} WHERE 1=0'.format(table)
    cur = con.cursor()
    cur.execute(query)
    nullable = {}
    for descr in cur.description:
        nullable[descr[0]] = descr[6]
    return nullable


def create_dict_for_insert(con):
    """This function is used to create a dictionnary containing all the tables
    and there column that must appear in the UI as well as an indicator to which
    insert category it belong (1, 2 or 3). It gives to each column name a set of
    parameters that we are interested in:
    -foreign_table is used when the value we are adding is stored in another
    table
    -nullable describe if the attribut can be null
    -insert_foreign_table tells us if we can create a new tuple in the foreign
    table where is stored the value (artists for example)
    -foreign_relation is in the case where the value is stored in another table
    and the relation is stored in a 3rd one. This is the name of this foreign
    relation """
    # create dict of dictionnary
    insert_dict = dict()
    tables = get_table_names(con)
    for table in tables:
        attributs = get_column_names(con, table)
        nullable = get_column_nullable(con, table)
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
            if '_ID' not in attribut:
                # clean and insert column name with insert indicator 1
                insert_dict[table][attribut] = {
                    'case': 1,
                    'nullable': bool(nullable[attribut])
                }
            else:
                # get the foreign table where to store the vale for case 2 and
                # 3
                foreign_table = attribut.replace('_ID', '')
                # special case for reprint_note
                if foreign_table == "REPRINT_NOTE":
                    foreign_table = "NOTE"
                # add the attribut and its properties
                insert_dict[table][attribut] = {
                    'case': 2,
                    'foreign_table': foreign_table,
                    'nullable': bool(nullable[attribut]),
                    'insert_foreign_table': True
                }
                # set to false the insert_foreign_table if the table has more
                # than one attribut other than the ID
                if len(get_column_names(con, foreign_table)) > 2:
                    insert_dict[table][attribut]['insert_foreign_table'] = False
        # go through tables and find elements where the first attribut
        # is TABLE_ID
        for table2 in tables:
            # ignore case first_last_issue
            if table2 == 'FIRST_LAST_ISSUE':
                continue
            # check the first attribut
            attributs2 = get_column_names(con, table2)
            if table + '_ID' == attributs2[0]:
                # get the table of the other attribut by removing _id to the
                # name
                foreign_table = attributs2[1].replace('_ID', '')
                # get the coliumn name to add in the insert form
                # it is the last word in the relational table
                col_name = table2.split('_')[-1]
                # add the element and its properties
                insert_dict[table][col_name] = {
                    'case': 3,
                    'foreign_table': foreign_table,
                    'foreign_relation': table2,
                    'nullable': True,
                    'insert_foreign_table': True
                }
                if len(get_column_names(con, foreign_table)) > 2:
                    insert_dict[table][attribut]['insert_foreign_table'] = False
    return insert_dict


def insertion(insert_dict, form_info, con):
    """This function creates an insert query and executes it"""
    # get the table we are interested in
    table = form_info['table-name']
    # initialize an empty dictionnary to store the values to add
    inserted_elem = {}
    # get an unused ID
    inserted_elem['ID'] = get_new_id(con, table)
    # get the fields of our table and loop through them
    fields = insert_dict[table]
    for field, descr in fields.items():
        # check if field is non nullable and empty return error if it is the case
        # and cancel query
        if descr['nullable'] == False and form_info[field] == '':
            print('error missing field {}'.format(field))
            return
        # add element only if user entered something
        if not form_info[field] == '':
            # case 1
            if descr['case'] == 1:
                inserted_elem[field] = form_info[field]
            else:
                # case 2
                if descr['case'] == 2:
                    # get value to add to the tuple
                    result = insert_case_2_3(con, descr, form_info[field])
                    # if no result was given cancel query
                    if not result:
                        return
                    inserted_elem[field] = result
                # case 3
                if descr['case'] == 3:
                    result = insert_case_2_3(
                        con, descr, form_info[field], inserted_elem['ID'])
                    if not result:
                        return
    # make the final query and execute it
    query = insert_query(inserted_elem, table)
    print(query)
    #execute_query(con, query, inserted_elem)
    # con.commit()


def get_new_id(con, table):
    """This function gets an unused ID number for the requested table"""
    # check for error on table name
    if table not in get_table_names(con):
        raise ValueError('Invalid table name')
    # get the maximal ID used
    query = 'SELECT MAX(ID) FROM {}'.format(table)
    # add one the the obtained result
    result = execute_query(con, query)[1][0][0] + 1
    return result


def insert_case_2_3(con, field_descr, value, table_ID=None):
    """This function returns a ID number to add to the table we are inserting in
    for case 2. It also add a relation to the relational tasble in case 3 .
    And both for case 2 and 3 if allowed it creates a new tuple in the table
    if the value we are adding doesn't exist"""
    # get the foreign table we are stored the values we are interested in
    table = field_descr['foreign_table']
    # get the boolean to know if we can add tuple in case it doesn't exist
    new_tuple = field_descr['insert_foreign_table']
    # check if table exsits
    if table not in get_table_names(con):
        raise ValueError('Invalid table name')
    # lines to obtain the name of the attribut we are interested in
    col_names = get_column_names(con, table)
    if len(col_names) > 2:
        attribut_col = 'NAME' if 'NAME' in col_names else 'TITLE'
    else:
        attribut_col = col_names[1]
    # get the ID for the value submited by the user
    query = "SELECT ID FROM {} WHERE {} = :value".format(table, attribut_col)
    (schema, data) = execute_query(con, query, value=value)
    # if no ID was found
    if not data:
        # if we can add the tupple get new id and insert it
        if new_tuple:
            new_id = get_new_id(con, table)
            query = 'INSERT INTO {} VALUES (:id,:value)'.format(table)
            #execute_query(con, query, id=new_id, value=value)
        # if we can't insert it stop the execution
        else:
            print('cannot add new element to {} give valid one'.format(table))
            return None
    # if data was found give the ID of the value
    else:
        new_id = data[0][0]
    # in case 3 add the relation between both entites in the relation table
    if table_ID and new_tuple:
        relation = field_descr['foreign_relation']
        query = 'INSERT INTO {} VALUES (:table_ID,:foreign_id)'.format(
            relation)
        #execute_query(con, query, table_id = table_ID,foreign_id = new_id)
    # give the ID to be inserted in the table
    return new_id


def insert_query(insert_values, table):
    """This function is used to create the final query that adds the tupple"""
    field_names = []
    key_names = []
    for key in insert_values:
        field_names.append(key)
        key_names.append(':' + key)

    key_names = ' , '.join(key_names)
    field_names = ' , '.join(field_names)
    query = 'INSERT INTO {} ({}) VALUES ({})'.format(
        table, field_names, key_names)
    return query
