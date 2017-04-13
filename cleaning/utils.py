import pandas as pd
import numpy as np
import re

def unpack_column(df, id_colname, packed_colname, sep=';'):
    """ Unpack a column cells as list and build the corresponding relation """

    dummy_name = 'name'

    # Extract the relation
    relation = df[[id_colname, packed_colname]].copy()

    # Split the lists
    relation[packed_colname] = relation[packed_colname].apply(lambda x: str(x).split(sep))

    # Magic happens here
    to_concat = [relation, pd.DataFrame(relation[packed_colname].tolist())]
    relation = pd.concat(to_concat, axis=1).drop(packed_colname, axis=1)
    relation = pd.melt(relation, var_name=dummy_name, value_name=packed_colname, id_vars=[id_colname])
    relation = relation.dropna(how='any').drop(dummy_name, axis=1).sort_values(by=id_colname)

    return relation

def clean_colum(column):

    # List of string that we want to remove
    stringToRemove = ["(\(.*\))" , "(\[.*\])" , "\?" , "\(" , "\)" , "\[" , "\]"]

    #Make regular expression based on the list of strings
    expression = re.compile('|'.join(stringToRemove))

    #remove all data in () and in [], removes trailing white space and set empty cells to nan
    column = column.str.replace(expression,"").str.strip('; ').replace('',np.nan)
    return column.dropna()


def extract_table(column,new_col_name):
    column = column.drop_duplicates(keep='first').reset_index(drop=True)
    #Shift to start with ID 1
    column.index = column.index + 1
    df = column.to_frame()
    df.columns = [new_col_name]
    df['id'] = df.index
    return df[['id',new_col_name]]

def map_column(col, table):
    """
	Map the values in col to the IDs in table.

	table must have two columns (id, value).
	col values correspond to table values.
	"""
    mapper = pd.Series(table[table.columns[0]].values, index=table[table.columns[1]])
    return col.map(mapper)
