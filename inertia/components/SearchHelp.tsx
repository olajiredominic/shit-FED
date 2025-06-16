
function SearchHelp() {
  return (
    <div className="mt-2 text-xs text-sand-10">
      <p>
        <strong>Search tips:</strong> Use{' '}
        <code className="bg-sand-3 px-1 rounded">after:DD/MM/YYYY</code>,{' '}
        <code className="bg-sand-3 px-1 rounded">before:DD/MM/YYYY</code>, or{' '}
        <code className="bg-sand-3 px-1 rounded">reporter:email@domain.com</code>
        <code className="bg-sand-3 px-1 rounded">labels:tag1,tag2</code>
      </p>
      <p className="mt-1">
        <strong>Example:</strong>{' '}
        <code className="bg-sand-3 px-1 rounded">after:27/09/2019 xss</code> - finds XSS issues
        created after 27 Sep 2019
      </p>
      <p className="mt-1">Add commentMore actions
        <code className="bg-sand-3 px-1 rounded">label:critical,security</code> - finds issues with
        critical OR security labels
      </p>
    </div >
  )
}


export default SearchHelp;