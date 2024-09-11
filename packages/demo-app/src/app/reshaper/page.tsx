const Page = () => {
  return (
    <div className="grid grid-rows-[auto_1fr] w-screen h-screen fixed inset-0">
      <div className="h-10 border-b bg-white border-gray-200 flex items-center justify-center">
        <div className="bg-gray-100 w-[320px] rounded text-gray-500 px-3 py-1 text-sm">
          http://localhost:3000
        </div>
      </div>
      <div className="grid grid-cols-[auto_1fr_auto]">
        <div className="w-64 bg-white border-r border-gray-200"></div>
        <div className="relative">
          <iframe src="/" className="w-full h-full"></iframe>
        </div>
        <div className="w-64 bg-white border-l border-gray-200"></div>
      </div>
    </div>
  );
};

export default Page;
