import pandas as pd

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