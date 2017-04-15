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
    relation[packed_colname] = relation[packed_colname].replace('nan', np.nan)
    relation = relation.dropna(how='any').drop(dummy_name, axis=1).sort_values(by=id_colname)

    return relation

def clean_column(col):
    """ Clean a given Serie by removing special characters and patterns """

    # Remove string in () or [] or ?...
    col = col.str.replace(r'(\(.*\))|(\[.*\])|\?|\(|\)|\[|\]', '')
    
    # Remove whitespaces before and after '.'
    col = col.str.replace(r'\s*\.\s*', '.')

    # Strip and replace NaN values
    col = col.str.strip('; ').replace('', np.nan)#.replace('nan',np.nan)

    return col


def extract_table(col, col_name):
    """ Extract a table from a column of values by assigning new IDs """

    # Drop duplicates and build a fresh new index
    col = col.drop_duplicates(keep='first').reset_index(drop=True)

    # Shift to start with ID 1
    col.index = col.index + 1

    # Build a dataframe out of the column
    df = col.to_frame()

    # Set to the new column name
    df.columns = [col_name]

    # Add the new ID column
    df['id'] = df.index

    return df[['id', col_name]]

def map_column(col, table, id_col, value_col):
    """
    Map the values in col to the IDs in table.

    table must have two columns (id, value).
    col values correspond to table values.
    """
    mapper = pd.Series(table[id_col].values, index=table[value_col])
    return col.map(mapper)
