# comics-app

## Insertion documentation

For the insertion we distinguished 3 cases of attributs:
1. The attribut is part of the table and we store it's value directly in the table (ex. TITLE for STORY)
2. The attribut is part of the table but is a foreign key to another table (ex.STORY_TYPE_ID for STORY)
3. The attribut is not part of the table, the value is stored in another table and there is a relation linking the 2 tables (ex.SCRIPT for STORY the relation is stored in the SCRIPT relation and the name of the artist is stored in the ARTIST TABLE)

When the webapp is lauched we create a dictionnary containing all the information needed for each table on how we must insert each of it's attribut.

### Case 1
For this type of attibut we store in the dictionnary the number of the case (1) and a boolean nullable indicating if the value can be nil.

### Case 2 
For this case, we must store in the dictionnary the name of the foreign table, the nullable boolean as indicated previously and we must also store a boolean to indicate if we can add a new element in the foreign table or if it is forbiden and the user must give an existing one. The rule to allow this is that the foreign table must have only a single attribut. Ex. When adding a story, if the user enters an stroy_type that is not in the database then the interface will automatically add the new stroy_type with the new name. If the user is inserting a new issue and gives a non existing country then it will not add anything because country has 2 attributes and must add the country separately. To identify sush elements the attribut must be named XXX_ID where XXX is the exact name of the foreign table.

### Case 3
For this case, the dictionnary must store as before the nullable boolean, it must store the name of the foreign table where the actual information is stored and it must store the name of the table of the relation. The structure of the relation must be the follwing:

