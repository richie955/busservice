"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

// Define bus stops between College and Calicut
const STOPS = [
  { id: 'college', name: 'College', distance: 0 },
  { id: 'stop1', name: 'Pantheerankavu', distance: 3 },
  { id: 'stop2', name: 'Kozhikode Medical College', distance: 6 },
  { id: 'stop3', name: 'Eranhipalam', distance: 9 },
  { id: 'stop4', name: 'Thondayad', distance: 12 },
  { id: 'stop5', name: 'Palayam', distance: 15 },
  { id: 'calicut', name: 'Calicut', distance: 17 }
];

// Define bus schedules
const BUSES = [
  { 
    id: 'bus1', 
    name: 'Bus 1', 
    color: '#e74c3c',
    capacity: 40,
    occupied: 0,
    schedule: [
      { departure: '07:00', from: 'college', to: 'calicut', duration: 45 },
      { departure: '08:00', from: 'calicut', to: 'college', duration: 45 },
      { departure: '09:00', from: 'college', to: 'calicut', duration: 60 },
      { departure: '10:30', from: 'calicut', to: 'college', duration: 60 },
      { departure: '12:00', from: 'college', to: 'calicut', duration: 60 },
      { departure: '13:30', from: 'calicut', to: 'college', duration: 60 },
      { departure: '15:00', from: 'college', to: 'calicut', duration: 45 },
      { departure: '16:00', from: 'calicut', to: 'college', duration: 45 },
      { departure: '17:00', from: 'college', to: 'calicut', duration: 45 },
      { departure: '18:00', from: 'calicut', to: 'college', duration: 45 }
    ]
  },
  { 
    id: 'bus2', 
    name: 'Bus 2', 
    color: '#3498db',
    capacity: 40,
    occupied: 0,
    schedule: [
      { departure: '07:30', from: 'college', to: 'calicut', duration: 45 },
      { departure: '08:30', from: 'calicut', to: 'college', duration: 45 },
      { departure: '09:30', from: 'college', to: 'calicut', duration: 60 },
      { departure: '11:00', from: 'calicut', to: 'college', duration: 60 },
      { departure: '12:30', from: 'college', to: 'calicut', duration: 60 },
      { departure: '14:00', from: 'calicut', to: 'college', duration: 60 },
      { departure: '15:30', from: 'college', to: 'calicut', duration: 45 },
      { departure: '16:30', from: 'calicut', to: 'college', duration: 45 },
      { departure: '17:30', from: 'college', to: 'calicut', duration: 45 },
      { departure: '18:30', from: 'calicut', to: 'college', duration: 45 }
    ]
  }
];

const CollegeBusService = () => {
  const [currentTime, setCurrentTime] = useState('');
  const [selectedStart, setSelectedStart] = useState('college');
  const [selectedDestination, setSelectedDestination] = useState('calicut');
  const [buses, setBuses] = useState(BUSES);
  const [busPositions, setBusPositions] = useState({});
  const [selectedBus, setSelectedBus] = useState(null);
  const [nextAvailableBuses, setNextAvailableBuses] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const busTrackRef = useRef(null);

  // Format time as HH:MM
  const formatTime = (date) => {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // Convert HH:MM to minutes since midnight
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Calculate current positions of buses
  const calculateBusPositions = (currentTimeStr) => {
    const currentTimeMinutes = timeToMinutes(currentTimeStr);
    const newPositions = {};
    
    buses.forEach(bus => {
      // Find the current or next trip for this bus
      let currentTrip = null;
      let tripProgress = 0;
      
      for (let i = 0; i < bus.schedule.length; i++) {
        const trip = bus.schedule[i];
        const departureMinutes = timeToMinutes(trip.departure);
        const arrivalMinutes = departureMinutes + trip.duration;
        
        if (currentTimeMinutes >= departureMinutes && currentTimeMinutes <= arrivalMinutes) {
          // Bus is currently on this trip
          currentTrip = trip;
          tripProgress = (currentTimeMinutes - departureMinutes) / trip.duration;
          break;
        } else if (currentTimeMinutes < departureMinutes) {
          // Bus is waiting for this trip
          currentTrip = trip;
          tripProgress = 0;
          break;
        }
      }
      
      if (currentTrip) {
        // Find the start and end stops
        const fromStop = STOPS.find(stop => stop.id === currentTrip.from);
        const toStop = STOPS.find(stop => stop.id === currentTrip.to);
        
        if (fromStop && toStop) {
          // Calculate position
          const distance = toStop.distance - fromStop.distance;
          const currentDistance = fromStop.distance + (distance * tripProgress);
          
          // Determine which stop the bus is at or closest to
          let currentStopId = fromStop.id;
          let nearestStopDistance = Infinity;
          
          STOPS.forEach(stop => {
            const distanceToStop = Math.abs(stop.distance - currentDistance);
            if (distanceToStop < nearestStopDistance) {
              nearestStopDistance = distanceToStop;
              currentStopId = stop.id;
            }
          });
          
          newPositions[bus.id] = {
            tripProgress,
            currentDistance,
            totalDistance: Math.abs(toStop.distance - fromStop.distance),
            fromStop: fromStop.id,
            toStop: toStop.id,
            currentStopId,
            departureTime: currentTrip.departure,
            arrivalTime: formatTime(new Date(timeToMinutes(currentTrip.departure) * 60000 + currentTrip.duration * 60000)),
            direction: toStop.distance > fromStop.distance ? 'right' : 'left',
            status: tripProgress > 0 ? 'moving' : 'waiting',
            nearestStopDistance
          };
        }
      } else {
        // Bus has completed all trips for the day
        const lastTrip = bus.schedule[bus.schedule.length - 1];
        const toStop = STOPS.find(stop => stop.id === lastTrip.to);
        
        newPositions[bus.id] = {
          tripProgress: 1,
          currentDistance: toStop.distance,
          totalDistance: 0,
          fromStop: lastTrip.from,
          toStop: lastTrip.to,
          currentStopId: toStop.id,
          departureTime: lastTrip.departure,
          arrivalTime: formatTime(new Date(timeToMinutes(lastTrip.departure) * 60000 + lastTrip.duration * 60000)),
          direction: 'right',
          status: 'parked',
          nearestStopDistance: 0
        };
      }
    });
    
    return newPositions;
  };

  // Update bus positions and time
  useEffect(() => {
    const interval = setInterval(() => {
      // For demo purposes, we'll use real time but you can add a speed factor
      const now = new Date();
      const timeStr = formatTime(now);
      setCurrentTime(timeStr);

      // Calculate bus positions based on the current time
      const positions = calculateBusPositions(timeStr);
      setBusPositions(positions);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [buses]);

  const handleBoardBus = (busId) => {
    setBuses(prevBuses => {
      return prevBuses.map(bus => {
        if (bus.id === busId && bus.occupied < bus.capacity) {
          return { ...bus, occupied: bus.occupied + 1 };
        }
        return bus;
      });
    });
    setSelectedBus(busId);
  };
  
  const getBusPositionStyle = (busId) => {
    const position = busPositions[busId];
    if (!position) return { left: '0%' };
    
    // Calculate the relative position based on first and last stops
    const firstStop = STOPS[0];
    const lastStop = STOPS[STOPS.length - 1];
    const totalRouteDistance = lastStop.distance - firstStop.distance;
    
    // Position as percentage along the route
    let percentPosition = (position.currentDistance / totalRouteDistance) * 100;
    
    // Ensure the position stays within track bounds
    percentPosition = Math.max(0, Math.min(100, percentPosition));
    
    return { 
      left: `${percentPosition}%`,
      transition: position.status === 'moving' ? 'left 1s linear' : 'none'
    };
  };

  const getCapacityColor = (occupied, capacity) => {
    const percentage = (occupied / capacity) * 100;
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Find next available buses for selected route
  const findNextAvailableBuses = () => {
    if (selectedStart === selectedDestination) {
      setNextAvailableBuses([]);
      setSearchPerformed(true);
      return;
    }

    const currentTimeMinutes = timeToMinutes(currentTime);
    const availableBuses = [];
    
    // Get indices of selected stops to determine direction
    const startIndex = STOPS.findIndex(stop => stop.id === selectedStart);
    const endIndex = STOPS.findIndex(stop => stop.id === selectedDestination);
    const isForward = endIndex > startIndex;
    
    // Direction we're looking for
    const direction = isForward ? 'calicut' : 'college';
    
    buses.forEach(bus => {
      // Find the next trip that matches our criteria
      for (let i = 0; i < bus.schedule.length; i++) {
        const trip = bus.schedule[i];
        
        // Check if trip direction matches what we need
        const tripDirection = trip.to === direction;
        
        // Calculate departure time in minutes
        const departureMinutes = timeToMinutes(trip.departure);
        
        // Only consider future trips
        if (departureMinutes >= currentTimeMinutes) {
          // Find the stop indices for this trip
          const tripStartIndex = STOPS.findIndex(stop => stop.id === trip.from);
          const tripEndIndex = STOPS.findIndex(stop => stop.id === trip.to);
          
          // Check if our selected start/end fall within this trip's route
          const startsBeforeOurStart = tripStartIndex <= startIndex;
          const endsAfterOurEnd = tripEndIndex >= endIndex;
          
          // For reverse direction
          const startsAfterOurStart = tripStartIndex >= startIndex;
          const endsBeforeOurEnd = tripEndIndex <= endIndex;
          
          const isValidTrip = isForward 
            ? (startsBeforeOurStart && endsAfterOurEnd)
            : (startsAfterOurStart && endsBeforeOurEnd);
          
          if (isValidTrip) {
            // Calculate estimated arrival at selected start
            const startStopDist = Math.abs(STOPS[tripStartIndex].distance - STOPS[startIndex].distance);
            const totalTripDist = Math.abs(STOPS[tripEndIndex].distance - STOPS[tripStartIndex].distance);
            const timeToStart = Math.floor((startStopDist / totalTripDist) * trip.duration);
            
            const startArrivalTime = new Date(departureMinutes * 60000 + timeToStart * 60000);
            const startArrivalTimeStr = formatTime(startArrivalTime);
            
            // Calculate estimated arrival at destination
            const endStopDist = Math.abs(STOPS[tripStartIndex].distance - STOPS[endIndex].distance);
            const timeToEnd = Math.floor((endStopDist / totalTripDist) * trip.duration);
            
            const endArrivalTime = new Date(departureMinutes * 60000 + timeToEnd * 60000);
            const endArrivalTimeStr = formatTime(endArrivalTime);
            
            availableBuses.push({
              busId: bus.id,
              busName: bus.name,
              color: bus.color,
              capacity: bus.capacity,
              occupied: bus.occupied,
              tripInfo: trip,
              departureTime: trip.departure,
              startArrivalTime: startArrivalTimeStr,
              endArrivalTime: endArrivalTimeStr,
              remainingMinutes: departureMinutes - currentTimeMinutes
            });
            
            // Only keep the next available trip for this bus
            break;
          }
        }
      }
    });
    
    // Sort by departure time
    availableBuses.sort((a, b) => a.remainingMinutes - b.remainingMinutes);
    setNextAvailableBuses(availableBuses);
    setSearchPerformed(true);
  };

  const renderBusSchedule = (bus) => {
    return (
      <div key={bus.id} className="mb-4 p-4 border rounded shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold" style={{ color: bus.color }}>{bus.name}</h3>
          <div className="flex items-center space-x-2">
            <div className="text-sm">Capacity: {bus.occupied}/{bus.capacity}</div>
            <div className={`w-32 h-3 rounded-full bg-gray-200`}>
              <div 
                className={`h-3 rounded-full ${getCapacityColor(bus.occupied, bus.capacity)}`} 
                style={{ width: `${(bus.occupied / bus.capacity) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-5 gap-2 text-sm bg-gray-100 p-2 rounded">
          <div className="font-medium">Departure</div>
          <div className="font-medium">From</div>
          <div className="font-medium">To</div>
          <div className="font-medium">Duration</div>
          <div className="font-medium">Status</div>
          
          {bus.schedule.map((trip, index) => {
            const departureMinutes = timeToMinutes(trip.departure);
            const arrivalMinutes = departureMinutes + trip.duration;
            const currentTimeMinutes = timeToMinutes(currentTime);
            
            let status = 'Upcoming';
            if (currentTimeMinutes > arrivalMinutes) {
              status = 'Completed';
            } else if (currentTimeMinutes >= departureMinutes) {
              status = 'In Progress';
            }
            
            return (
              <React.Fragment key={index}>
                <div>{trip.departure}</div>
                <div>{STOPS.find(stop => stop.id === trip.from)?.name}</div>
                <div>{STOPS.find(stop => stop.id === trip.to)?.name}</div>
                <div>{trip.duration} mins</div>
                <div className={
                  status === 'Completed' ? 'text-gray-500' : 
                  status === 'In Progress' ? 'text-green-600 font-medium' : 
                  'text-blue-600'
                }>
                  {status}
                </div>
              </React.Fragment>
            );
          })}
        </div>
        
        {busPositions[bus.id]?.status === 'moving' && (
          <div className="mt-2 text-sm">
            <span className="font-medium">Current location:</span> Near {STOPS.find(stop => stop.id === busPositions[bus.id]?.currentStopId)?.name}
            {busPositions[bus.id]?.nearestStopDistance < 0.5 && (
              <span className="ml-2 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                At stop
              </span>
            )}
          </div>
        )}
        
        <div className="mt-3">
          <button
            onClick={() => handleBoardBus(bus.id)}
            disabled={bus.occupied >= bus.capacity || busPositions[bus.id]?.status !== 'waiting'}
            className={`px-4 py-1 rounded text-white text-sm ${bus.occupied >= bus.capacity || busPositions[bus.id]?.status !== 'waiting' ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {bus.occupied >= bus.capacity ? 'Bus Full' : 'Board Bus'}
          </button>
          {selectedBus === bus.id && (
            <span className="ml-2 text-sm text-green-600">You have boarded this bus</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">College Bus Service</h1>
        <div className="flex items-center">
          <Clock className="mr-2" size={20} />
          <span className="text-lg">{currentTime}</span>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Route Selection</h2>
        <div className="flex flex-wrap gap-4">
          <div className="w-full md:w-5/12">
            <label className="block text-sm font-medium text-gray-700 mb-1">Starting Point</label>
            <select 
              className="w-full border rounded-md p-2"
              value={selectedStart}
              onChange={(e) => {
                setSelectedStart(e.target.value);
                setSearchPerformed(false);
              }}
            >
              {STOPS.map(stop => (
                <option key={stop.id} value={stop.id}>{stop.name}</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-5/12">
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
            <select 
              className="w-full border rounded-md p-2"
              value={selectedDestination}
              onChange={(e) => {
                setSelectedDestination(e.target.value);
                setSearchPerformed(false);
              }}
            >
              {STOPS.map(stop => (
                <option key={stop.id} value={stop.id}>{stop.name}</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-1/12 flex items-end">
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md w-full"
              onClick={findNextAvailableBuses}
            >
              Go
            </button>
          </div>
        </div>
        
        {/* Search Results */}
        {searchPerformed && (
          <div className="mt-4 border-t pt-4">
            <h3 className="font-medium mb-2">Next Available Buses:</h3>
            {nextAvailableBuses.length > 0 ? (
              <div className="space-y-3">
                {nextAvailableBuses.map((busInfo, index) => (
                  <div key={index} className="border rounded p-3 bg-gray-50">
                    <div className="flex justify-between">
                      <div>
                        <span 
                          className="font-medium mr-2" 
                          style={{ color: busInfo.color }}
                        >
                          {busInfo.busName}
                        </span>
                        <span className="text-sm">
                          ({busInfo.occupied}/{busInfo.capacity} seats occupied)
                        </span>
                      </div>
                      <div className="text-sm font-medium">
                        {busInfo.remainingMinutes <= 0 
                          ? 'Departing now' 
                          : `Departing in ${busInfo.remainingMinutes} mins`}
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm mt-2">
                      <div>
                        <div className="text-gray-600">From: {STOPS.find(stop => stop.id === busInfo.tripInfo.from)?.name}</div>
                        <div className="text-gray-600">Departure: {busInfo.departureTime}</div>
                        <div className="text-gray-600">Arrives at {STOPS.find(stop => stop.id === selectedStart)?.name}: {busInfo.startArrivalTime}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-600">To: {STOPS.find(stop => stop.id === busInfo.tripInfo.to)?.name}</div>
                        <div className="text-gray-600">
                          Arrives at {STOPS.find(stop => stop.id === selectedDestination)?.name}: {busInfo.endArrivalTime}
                        </div>
                        <button
                          onClick={() => handleBoardBus(busInfo.busId)}
                          disabled={busInfo.occupied >= busInfo.capacity}
                          className={`mt-1 px-4 py-1 rounded text-white text-xs ${
                            busInfo.occupied >= busInfo.capacity 
                              ? 'bg-gray-400' 
                              : 'bg-blue-500 hover:bg-blue-600'
                          }`}
                        >
                          {busInfo.occupied >= busInfo.capacity ? 'Bus Full' : 'Board Bus'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-600">
                {selectedStart === selectedDestination 
                  ? 'Please select different start and destination points.' 
                  : 'No buses available for this route at this time.'}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Live Bus Tracker</h2>
        <div 
          ref={busTrackRef}
          className="relative h-20 bg-gray-200 rounded-lg overflow-hidden mb-2 shadow-inner"
        >
          {/* Bus track with stops */}
          <div className="absolute inset-0 flex justify-between px-4 items-center">
            {STOPS.map((stop, index) => (
              <div 
                key={stop.id} 
                className="flex flex-col items-center z-10"
                style={{ 
                  position: 'absolute', 
                  left: `${(stop.distance / STOPS[STOPS.length - 1].distance) * 100}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                <span className="text-xs mt-1">{stop.name}</span>
              </div>
            ))}
            
            {/* Path between stops */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-400 transform -translate-y-1/2 z-0"></div>
          </div>
          
          {/* Buses */}
          {buses.map(bus => (
            <div 
              key={bus.id}
              className={`absolute top-1/2 transform -translate-y-1/2 z-20 transition-transform ${
                busPositions[bus.id]?.direction === 'left' ? 'scale-x-[-1]' : ''
              }`}
              style={getBusPositionStyle(bus.id)}
            >
              <div 
                className="w-12 h-6 rounded-sm flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: bus.color }}
              >
                {bus.name}
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {buses.map(renderBusSchedule)}
        </div>
      </div>
    </div>
  );
};

export default CollegeBusService;