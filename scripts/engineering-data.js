// Engineering projects, one row each on the blueprint parts list, in this order.
// Text comes from the project write-ups linked below and from
// kondwaniphiri.com/projects; nothing here is invented.
//
//   drawing:  which line drawing stands for it (scripts/blueprints.js)
//   cover:    a Google Drive file ID whose first page becomes the report cover;
//             without one, the cover is drawn
//   docs:     `url` opens the file in the site's reader (reports/ holds the copies
//             made from Drive); `drive` opens Drive's viewer, for what can't be a PDF
//   readouts: numbers that count up when the project opens

window.ENGINEERING = [
  {
    id: 'turbine',
    title: 'Axial Turbine Stage',
    course: 'AME 415',
    context: 'Turbine Design Final Project · USC',
    // The report itself is undated; its Drive copy was last updated May 20, 2026.
    when: '2026',
    kind: 'Aero · CFD',
    drawing: 'turbine',
    cover: '11GehfwOKkVCG5hqijnF7rAjkEV1kxHmz',
    team: 'Abby R., Jake S., Kondwani P.',
    summary: [
      "Group 7's critical design review for a turbine stage: the chosen design parameters, 1-D calculations, velocity triangles at the hub, mean, and tip, sizing of the main turbine elements, and stator and rotor airfoil design, each checked with 2D CFD.",
      "The final airfoil coordinates went through a 3D CFD virtual test against the team's declared performance. Our power came in 4.51% off the 3D result, inside the 5% allowance before penalties.",
    ],
    readouts: [
      { value: 96.45, decimals: 2, unit: '%', label: 'Total-to-total efficiency, 3D CFD' },
      { value: 14753, unit: ' hp', label: 'Power, 3D CFD virtual test' },
      { value: 240, suffix: ' / 230', label: 'Stator vanes / rotor blades' },
      { value: 4.51, decimals: 2, unit: '%', label: 'Declared power vs. 3D test' },
    ],
    methods: ['Velocity triangles', 'Airfoil design', '2D CFD', '3D CFD validation'],
    docs: [{ label: 'Critical design review', url: 'reports/AME415-Turbine-Critical-Design-Review.pdf' }],
  },
  {
    id: 'governor',
    title: 'Centrifugal Governor',
    course: 'AME 408',
    context: 'Senior CAD Engineering Project · USC',
    when: 'Apr 2026',
    kind: 'CAD · FEA',
    drawing: 'governor',
    cover: '1kQH2iyoIoT9as_hPnVibDu5vg9XvcWVk',
    team: 'Houzhen Q., Adam Kim, Kondwani Phiri, Eduardo Cortes-Cruz',
    summary: [
      'A centrifugal governor regulates rotational speed by turning angular velocity into controlled radial displacement: flexible legs on a rigid shaft deflect outward as speed rises. Ours, in MIRAGE 250 CVM, had to fit a fixed annular housing under strict stress, displacement, and frequency limits.',
      'We ran a full parametric sweep over five geometric variables (L1, L2, t, W, d) in 0.25 mm increments, with a mesh-convergence study behind the FEA. The final design met the stress, axial deflection, radial extent, and manufacturability targets with margin, and came in about 8% over the natural-frequency requirement.',
    ],
    readouts: [
      { value: 5, label: 'Geometric variables swept' },
      { value: 0.25, decimals: 2, unit: ' mm', label: 'Sweep increment' },
      { value: 4, label: 'Person team' },
    ],
    methods: ['Parametric sweep', 'FEA', 'Mesh convergence', 'MIRAGE 250 CVM'],
    docs: [{ label: 'Final report', url: 'reports/AME408-Centrifugal-Governor-Final-Report.pdf' }],
  },
  {
    id: 'lightmeter',
    title: 'Photon 2 Light Meter',
    course: 'TAC 348',
    context: 'Making Smart Devices · USC',
    when: 'Spring 2026',
    kind: 'Electronics · IoT',
    drawing: 'lightmeter',
    cover: '13TtwZ44ev5cL1fR8Sx_okmWaG913LAgy',
    team: 'Solo project',
    summary: [
      'A handheld light meter for film photography, built to bring digital convenience to film without giving up the slow, deliberate workflow that makes shooting it fun. A BH1750 sensor reads ambient light; the meter works out the exposure value and recommends a shutter speed for the chosen aperture and ISO.',
      'Readings show on a small OLED, and a servo swings a physical exposure needle for an analog feel. A potentiometer dials f/1.4 to f/16, a button switches display modes, and an RGB LED shows exposure at a glance: green for correct, blue for under, red for over. ISO is set from a phone through Blynk, and every reading streams to an InitialState dashboard every 10 seconds.',
    ],
    readouts: [
      { value: 10, unit: ' s', label: 'Dashboard update interval' },
      { value: 8, label: 'f-stops on the aperture dial' },
      { value: 3, label: 'LED exposure states' },
    ],
    methods: ['Photon 2', 'BH1750 sensor', 'OLED', 'Servo needle', 'Blynk', 'InitialState'],
    meter: true,
    docs: [
      { label: 'Developer documentation', url: 'reports/TAC348-Light-Meter-Developer-Documentation.pdf' },
      { label: 'Walkthrough video', drive: '1nO0pupfGpJVEyhGqzh7j7Mma8saKWDvS' },
    ],
  },
  {
    id: 'drone',
    title: 'Autonomous Toy Drone',
    course: 'AME 308',
    context: 'Computer-Aided Design · USC',
    when: 'Nov 2024',
    kind: 'CAD · FEA',
    drawing: 'drone',
    team: 'Group project',
    summary: [
      'Junior-year project for a computer-aided design course at USC. Collaborated on the full design of a toy drone, including CAD modeling, material selection, FEA stress testing, and motion analysis. Led part design and final model verification.',
    ],
    readouts: [],
    methods: ['CAD modeling', 'Material selection', 'FEA stress testing', 'Motion analysis'],
    docs: [{ label: 'Final project', url: 'projects/AME%20308%20Final%20Project.pdf' }],
  },
  {
    id: 'shear',
    title: 'Shear Banding in Amorphous Materials',
    course: 'Del Gado Group',
    context: 'Department of Physics · Georgetown University',
    when: 'Summer 2024',
    kind: 'Research · Materials',
    drawing: 'shear',
    team: 'Independent research',
    summary: [
      'At the Del Gado Group in the Department of Physics, I conducted independent research on amorphous materials and shear banding phenomena. The project centered on interpreting landmark data from foundational studies and comparing it with contemporary simulations.',
      'I analyzed discrepancies between expected and actual material behavior under varied shear rates using MATLAB and QtGrace for plotting. My findings contradicted previous results, suggesting factors such as experimental setup, temperature variance, or human error. The project explored engineering applications in product design, petrochemical processes, and civil infrastructure, and emphasized future potential in sustainability and environmental resilience.',
    ],
    readouts: [{ value: 30, suffix: '+', label: 'Samples analyzed' }],
    methods: ['MATLAB', 'QtGrace', 'Shear-rate analysis'],
    docs: [{ label: 'Final presentation', url: 'Presented%20by%20Kondwani%20Phiri.pdf' }],
  },
];
