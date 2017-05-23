--Print the brand group names with the highest number of Belgian indicia publishers:
SELECT B.name
FROM Brand_Group B, Publisher P, Indicia_Publisher I, Country C
WHERE B.publisher_id = P.id AND
      P.id = I.publisher_id AND
      I.country_id = C.id AND
      C.name = 'Belgium'
GROUP BY B.id, B.name
ORDER BY COUNT(*) DESC
FETCH FIRST ROW ONLY
;

--Print the ids and names of publishers of Danish book series:
SELECT DISTINCT P.id, P.name
FROM Serie S, Publisher P, Publication_Type PT, Country C
WHERE S.publisher_id = P.id AND
      S.country_id = C.id AND
      C.name = 'Denmark' AND
      S.publication_type_id = PT.id AND
      PT.name = 'book'
;

--Print the names of all Swiss series that have been published in magazines:
SELECT S.name
FROM Serie S, Country C, Publication_Type T
WHERE S.country_id = C.id AND
	C.name = 'Switzerland' AND
	S.publication_type_id = T.id AND
	T.name = 'magazine'
;

--Starting from 1990, print the number of issues published each year:
SELECT I.publication_date, COUNT(*) as NUMBER_OF_ISSUES
FROM Issue I
WHERE I.publication_date >= '1990'
GROUP BY I.publication_date
ORDER BY I.publication_date ASC
;

--Print the number of series for each indicia publisher whose name resembles ‘DC comics’:
SELECT IP.name, COUNT(*)
FROM Indicia_Publisher IP, Serie S, Publisher P
WHERE IP.name LIKE ('%DC Comics%') AND
	IP.publisher_id = P.id AND
	S.publisher_id = P.id
GROUP BY IP.name
;

--Print the titles of the 10 most reprinted stories:
SELECT S.title
FROM Story_Reprint SR, Story S
WHERE S.id = SR.origin_id
GROUP BY S.id, S.title
ORDER BY COUNT(*) DESC
FETCH FIRST 10 ROWS ONLY
;

--Print the artists that have scripted, drawn, and colored at least one of the stories they were involved in:
SELECT DISTINCT A.name
FROM Artist A
WHERE A.id IN (SELECT S.artist_id
                  FROM Script S, Pencil P, Color C
		      WHERE S.artist_id = P.artist_id AND
                  P.artist_id = C.artist_id AND
                  P.story_id = C.story_id AND
                  P.story_id = S.story_id)
;

--Print all non-reprinted stories involving Batman as a non-featured character:
SELECT S.title
FROM Story S
WHERE NOT EXISTS (SELECT SR.origin_id
                  FROM Story_Reprint SR
                  WHERE SR.origin_id = S.id
                  )
      AND
      EXISTS (SELECT SC.story_id
                  FROM Story_Character SC, Character C
                  WHERE SC.story_id = S.id AND
                  SC.character_id = C.id AND
	            C.name = 'Batman')
      AND
      NOT EXISTS (SELECT SF.story_id
                  FROM Story_Feature SF, Character C
                  WHERE SF.story_id = S.id AND
                  SF.character_id = C.id AND
		      C.name = 'Batman')
;

-- Print the series names that have the highest number of issues which contain a story whose type (e.g., cartoon) is not the one occurring most frequently in the database (e.g, illustration). AT LEAST 1 STORY NOT OF THIS TYPE ?
SELECT SE.name
FROM Serie SE
WHERE SE.id = 
	(SELECT I.serie_id
		FROM Issue I
		WHERE EXISTS 
			(SELECT ST.id
				FROM Story ST
				WHERE I.id = ST.issue_id AND
						ST.story_type_id != 
							(SELECT S.story_type_id
								FROM Story S
								GROUP BY S.story_type_id
								ORDER BY COUNT(*) DESC
								FETCH FIRST ROW ONLY
							)
			)
		GROUP BY I.serie_id
		ORDER BY COUNT(*) DESC
		FETCH FIRST ROW ONLY
	)
;

-- Print the names of publishers who have series with all series types
SELECT P.name
FROM Publisher P, Serie S
WHERE S.publisher_id = P.id
GROUP BY P.id, P.name
HAVING COUNT(DISTINCT S.publication_type_id) = (SELECT COUNT(*) FROM Publication_Type)
;

-- Print the 10 most-reprinted characters from Alan Moore's stories
SELECT C.name, COUNT(*)
FROM Story_Reprint SR, Story S, Story_Character SC, Script SCR, Artist A, Character C
WHERE S.id = SR.origin_id AND 
		S.id = SC.story_id AND
            SC.character_id = C.id AND
		S.id = SCR.story_id AND
		SCR.artist_id = A.id AND
		A.name = 'Alan Moore'
GROUP BY SR.origin_id, C.name
ORDER BY COUNT(SR.target_id) DESC
FETCH FIRST 10 ROWS ONLY
;