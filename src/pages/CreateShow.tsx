import { useState } from 'react';

interface Track {
  title: string;
  artist: string;
  length: string;
  details?: string;
}

export default function CreateShow() {
  const [showTitle, setShowTitle] = useState('');
  const [showDescription, setShowDescription] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);

  const [trackTitle, setTrackTitle] = useState('');
  const [trackArtist, setTrackArtist] = useState('');
  const [trackLength, setTrackLength] = useState('');
  const [trackDetails, setTrackDetails] = useState('');

  const addTrack = () => {
    const newTrack = { title: trackTitle, artist: trackArtist, length: trackLength, details: trackDetails };
    setTracks([...tracks, newTrack]);
    setTrackTitle('');
    setTrackArtist('');
    setTrackLength('');
    setTrackDetails('');
  };

  const saveShow = () => {
    const showData = {
      title: showTitle,
      description: showDescription,
      tracks
    };
    console.log('Saving show:', showData);
    // Placeholder for server request
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Create a New Show</h1>
      <div>
        <label className="block text-sm font-bold mb-2" htmlFor="hostname">Host Name</label>
        <input
          type="text"
          value="Hardcoded Hostname"
          id="hostname"
          className="shadow border rounded w-full py-2 px-3 text-gray-700 mb-4"
          disabled
        />
        <label className="block text-sm font-bold mb-2" htmlFor="showTitle">Show Title</label>
        <input
          type="text"
          value={showTitle}
          onChange={(e) => setShowTitle(e.target.value)}
          id="showTitle"
          className="shadow border rounded w-full py-2 px-3 text-gray-700 mb-4"
        />
        <label className="block text-sm font-bold mb-2" htmlFor="showDescription">Show Description</label>
        <textarea
          value={showDescription}
          onChange={(e) => setShowDescription(e.target.value)}
          id="showDescription"
          className="shadow border rounded w-full py-2 px-3 text-gray-700 mb-4"
          rows={3}
        />
        <button onClick={saveShow} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Save Show
        </button>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Add Track</h2>
        <input
          type="text"
          value={trackTitle}
          onChange={(e) => setTrackTitle(e.target.value)}
          placeholder="Track Title"
          className="shadow border rounded w-full py-2 px-3 text-gray-700 mb-4"
        />
        <input
          type="text"
          value={trackArtist}
          onChange={(e) => setTrackArtist(e.target.value)}
          placeholder="Artist"
          className="shadow border rounded w-full py-2 px-3 text-gray-700 mb-4"
        />
        <input
          type="text"
          value={trackLength}
          onChange={(e) => setTrackLength(e.target.value)}
          placeholder="Track Length"
          className="shadow border rounded w-full py-2 px-3 text-gray-700 mb-4"
        />
        <textarea
          value={trackDetails}
          onChange={(e) => setTrackDetails(e.target.value)}
          placeholder="Track Details (optional)"
          className="shadow border rounded w-full py-2 px-3 text-gray-700 mb-4"
          rows={2}
        />
        <button onClick={addTrack} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Add Track
        </button>
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-bold">Current Tracks</h3>
        {tracks.map((track, index) => (
          <div key={index} className="mt-2 p-2 border rounded">
            <p><strong>Title:</strong> {track.title}</p>
            <p><strong>Artist:</strong> {track.artist}</p>
            <p><strong>Length:</strong> {track.length}</p>
            {track.details && <p><strong>Details:</strong> {track.details}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
