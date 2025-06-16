import SearchHelp from './SearchHelp'

interface HeaderProps {
  search: string
  handleSearch: (value: string) => void
  errorMessages?: string
  showSearchHelp: boolean
  setShowSearchHelp: (value: boolean) => void
}

const Header = ({
  search,
  handleSearch,
  errorMessages,
  showSearchHelp,
  setShowSearchHelp,
}: HeaderProps) => {
  return (
    <header className="sticky top-0 bg-sand-1 z-10 py-6">
      <div className="flex items-center space-x-2">
        <input
          type="search"
          placeholder="Search issues..."
          className="w-full max-w-2xl px-4 py-2 border border-sand-7 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          onChange={(e) => handleSearch(e.target.value)}
          value={search}
          onFocus={() => setShowSearchHelp(true)}
          onBlur={() => setTimeout(() => setShowSearchHelp(false), 200)}
        />
        <button
          className="text-sand-10 hover:text-sand-12 text-sm bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center"
          onClick={() => setShowSearchHelp(!showSearchHelp)}
          type="button"
        >
          ?
        </button>
      </div>
      {errorMessages && <span className="text-red-500 text-sm mt-2 block">{errorMessages}</span>}
      {showSearchHelp && <SearchHelp />}
    </header>
  )
}

export default Header