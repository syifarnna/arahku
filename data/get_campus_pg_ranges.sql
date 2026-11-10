-- Backend: rentang passing grade (terkecil-tertinggi) tiap PTN berdasarkan
-- seluruh program studi (prodi) yang terhubung di dalamnya.
-- Output: satu baris per kampus, nilai_min & nilai_max = MIN/MAX passing_grade_total
--        dari seluruh prodi yang ada di kampus tersebut.
CREATE OR REPLACE FUNCTION get_campus_pg_ranges()
RETURNS TABLE (
  institution_id INT,
  institution_name TEXT,
  grade_campus NUMERIC,
  nilai_min NUMERIC,
  nilai_max NUMERIC
)
LANGUAGE sql
AS $$
  SELECT i.id,
         i.name,
         i.grade,
         MIN(m.passing_grade_total) AS nilai_min,
         MAX(m.passing_grade_total) AS nilai_max
  FROM institutions i
  JOIN majors m ON m.institution_id = i.id
  WHERE m.passing_grade_total IS NOT NULL
  GROUP BY i.id, i.name, i.grade
  ORDER BY i.name;
$$;
