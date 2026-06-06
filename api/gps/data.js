module.exports = {
  river: {
    name: 'Severn River',
    location: 'Maryland, USA'
  },
  hazards: [
    {
      id: 'hazard-1',
      name: 'Severn Rocks (South)',
      latitude: 38.9150,
      longitude: -76.4450,
      type: 'rocks',
      severity: 'high',
      depth_feet: 3,
      description: 'Submerged rocks, avoid draft over 2 feet'
    },
    {
      id: 'hazard-2',
      name: 'Shallow Area - Horn Point',
      latitude: 38.9400,
      longitude: -76.4600,
      type: 'shallow',
      severity: 'medium',
      depth_feet: 5,
      description: 'Shallow water, approach with caution'
    }
  ],
  marinas: [
    {
      id: 'marina-1',
      name: 'Annapolis Yacht Club',
      latitude: 38.9722,
      longitude: -76.4822,
      services: ['fuel', 'repair', 'pump-out', 'mooring'],
      capacity: 200,
      contact: '+1-410-555-0101'
    },
    {
      id: 'marina-2',
      name: 'Severn Sailing Association',
      latitude: 38.9650,
      longitude: -76.4750,
      services: ['fuel', 'launch-ramp', 'mooring'],
      capacity: 150,
      contact: '+1-410-555-0102'
    }
  ],
  buoys: [
    {
      id: 'buoy-1',
      name: 'Severn Entrance - Red',
      latitude: 38.9200,
      longitude: -76.4500,
      type: 'nun',
      color: 'red',
      number: 2,
      description: 'Starboard hand mark'
    },
    {
      id: 'buoy-2',
      name: 'Severn Entrance - Green',
      latitude: 38.9220,
      longitude: -76.4520,
      type: 'can',
      color: 'green',
      number: 1,
      description: 'Port hand mark'
    }
  ],
  locks: [
    {
      id: 'lock-1',
      name: 'Severn River Lock',
      latitude: 38.9050,
      longitude: -76.4550,
      status: 'operational',
      hours: 'Sunrise to Sunset',
      contact: '+1-410-555-0123',
      lockage_time_minutes: 30,
      restrictions: 'No vessels over 65 feet'
    }
  ]
};
