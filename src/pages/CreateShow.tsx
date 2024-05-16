'use client'
import Header from '@/components/Header';
import { useState, useRef } from 'react';
// import { useUser } from '@/contexts/UserContext'; will update this with network requests
import { useEdgeStore } from '@/lib/edgestore';

interface Track {
  title: string;
  artist: string;
  length: string;
  details?: string;
  fileUrl?: string;
}

export default function CreateShow() {
    const { edgestore }  = useEdgeStore();
   
    // const { user }:any = useUser(); // Accessing the user from context
  const [showTitle, setShowTitle] = useState('');
  const [showDescription, setShowDescription] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);

  const [trackTitle, setTrackTitle] = useState('');
  const [trackArtist, setTrackArtist] = useState('');
  const [trackLength, setTrackLength] = useState('');
  const [trackDetails, setTrackDetails] = useState('');
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleFileChange = (files: FileList | null) => {
    console.log('Handle file changes:', files);
    if (files && files[0]) {
      setTrackFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileChange(files);
  };

  const addTrack = async () => {
     if (trackFile) {
      setIsUploading(true);
      try {
       console.log('Uploading - edgestore: ', edgestore)
        const response = await edgestore.publicFiles.upload({
          file: trackFile,
          onProgressChange: (progress) => {
                // you can use this to show a progress bar
                console.log(progress);
              },
        });
        const newTrack = {
          title: trackTitle,
          artist: trackArtist,
          length: trackLength,
          details: trackDetails,
          fileUrl: response.url,
        };
        
        setTracks([...tracks, newTrack]);
        setTrackTitle('');
        setTrackArtist('');
        setTrackLength('');
        setTrackDetails('');
        setTrackFile(null);
      } catch (error) {
        console.error('Error uploading track:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const saveShow = () => {
    const showData = {
      host: "KC & JOE JOE",
      title: showTitle,
      description: showDescription,
      tracks
    };
    console.log('Saving show:', showData);
    // Placeholder for server request
  };

  // if (!user) return <div>Please log in to create a show.</div>; // Guard clause for authentication

  return (
    <div className="p-8 bg-black h-full">
      <Header title="Melody Mixer Network" />
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
          name='Track Title'
          type="text"
          value={trackTitle}
          onChange={(e) => setTrackTitle(e.target.value)}
          placeholder="Track Title"
          className="shadow border rounded w-full py-2 px-3 text-gray-700 mb-4"
        />
        <input
          name='Track Artist'
          type="text"
          value={trackArtist}
          onChange={(e) => setTrackArtist(e.target.value)}
          placeholder="Artist"
          className="shadow border rounded w-full py-2 px-3 text-gray-700 mb-4"
        />
        <input
          name='Track Length'
          type="text"
          value={trackLength}
          onChange={(e) => setTrackLength(e.target.value)}
          placeholder="Track Length"
          className="shadow border rounded w-full py-2 px-3 text-gray-700 mb-4"
        />
        <textarea
          name='Track Details'
          value={trackDetails}
          onChange={(e) => setTrackDetails(e.target.value)}
          placeholder="Track Details (optional)"
          className="shadow border rounded w-full py-2 px-3 text-gray-700 mb-4"
          rows={2}
        />
        <div
          className="shadow border rounded w-full py-8 px-3 text-gray-700 mb-4 flex items-center justify-center bg-gray-200"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e.target.files)}
            className="hidden"
          />
          <button
            onClick={() => {
              fileInputRef.current?.click()
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {trackFile ? trackFile.name : 'Drag & Drop or Click to Upload Track'}
          </button>
        </div>
        <button
          onClick={addTrack}
          disabled={!trackFile || isUploading}
          className={`ml-6 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${
            !trackFile ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isUploading ? 'Uploading...' : 'Add Track'}
        </button>
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-bold h-full">Current Tracks</h3>
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
