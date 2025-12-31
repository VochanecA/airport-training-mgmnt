-- Insert sample training types
INSERT INTO public.training_types (name, description, duration_hours, validity_months, category) VALUES
  ('Bezbednost u vazdušnom saobraćaju', 'Osnovna obuka za bezbednost u vazdušnom saobraćaju', 40, 24, 'Bezbednost'),
  ('Prva pomoć', 'Obuka za pružanje prve pomoći', 16, 12, 'Zdravlje i sigurnost'),
  ('Upravljanje kriznim situacijama', 'Obuka za upravljanje vanrednim situacijama', 24, 36, 'Bezbednost'),
  ('Operativni postupci na platformi', 'Obuka za rad na platformi aerodroma', 32, 24, 'Operativno'),
  ('Protivpožarna zaštita', 'Obuka za protivpožarnu zaštitu i evakuaciju', 20, 12, 'Bezbednost');

-- Insert sample employees
INSERT INTO public.employees (first_name, last_name, email, phone, position, department, employee_number, hire_date) VALUES
  ('Marko', 'Petrović', 'marko.petrovic@aerodrom.rs', '+381641234567', 'Operativni menadžer', 'Operacije', 'EMP001', '2020-01-15'),
  ('Ana', 'Jovanović', 'ana.jovanovic@aerodrom.rs', '+381642345678', 'Bezbedonosni inspektor', 'Bezbednost', 'EMP002', '2019-03-20'),
  ('Nikola', 'Nikolić', 'nikola.nikolic@aerodrom.rs', '+381643456789', 'Tehničar', 'Održavanje', 'EMP003', '2021-06-10'),
  ('Jelena', 'Stojanović', 'jelena.stojanovic@aerodrom.rs', '+381644567890', 'Koordinator obuke', 'HR', 'EMP004', '2018-09-05'),
  ('Stefan', 'Dimitrijević', 'stefan.dimitrijevic@aerodrom.rs', '+381645678901', 'Operater platforme', 'Operacije', 'EMP005', '2022-02-14');

-- Insert sample trainings
INSERT INTO public.trainings (training_type_id, title, instructor, location, start_date, end_date, capacity, status)
SELECT 
  id,
  name || ' - ' || TO_CHAR(NOW() + INTERVAL '1 month', 'Mon YYYY'),
  'Instruktor ' || SUBSTRING(name FROM 1 FOR 10),
  'Sala za obuku A',
  NOW() + INTERVAL '1 month',
  NOW() + INTERVAL '1 month' + INTERVAL '5 days',
  20,
  'scheduled'
FROM public.training_types
LIMIT 3;
