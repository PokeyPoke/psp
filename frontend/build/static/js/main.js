// Political Sentiment Tracker - Updated Homepage with Sidebar Design
const { useState, useEffect } = React;

// HomePage Component with your requested design changes
function HomePage() {
  const [candidates, setCandidates] = useState([]);
  const [candidateMetrics, setCandidateMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('grid');
  const [sortBy, setSortBy] = useState('votes');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);
      
      // Load candidates
      const candidatesData = await fetch('/api/candidates').then(res => res.json());
      setCandidates(candidatesData);

      // Load metrics for each candidate
      const metricsPromises = candidatesData.map(async (candidate) => {
        try {
          const metrics = await fetch('/api/metrics/' + candidate.id + '/summary').then(res => res.json());
          return { candidateId: candidate.id, metrics };
        } catch (error) {
          return { candidateId: candidate.id, metrics: {} };
        }
      });

      const metricsResults = await Promise.all(metricsPromises);
      const metricsMap = {};
      metricsResults.forEach(({ candidateId, metrics }) => {
        metricsMap[candidateId] = metrics;
      });
      setCandidateMetrics(metricsMap);
      
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getSortedCandidates = () => {
    const candidatesWithMetrics = candidates.map(candidate => ({
      ...candidate,
      metrics: candidateMetrics[candidate.id] || {}
    }));

    return candidatesWithMetrics.sort((a, b) => {
      switch (sortBy) {
        case 'votes':
          return (b.metrics.vote_count || 0) - (a.metrics.vote_count || 0);
        case 'sentiment':
          return (b.metrics.reddit_sentiment || 0) - (a.metrics.reddit_sentiment || 0);
        case 'mentions':
          return ((b.metrics.reddit_mentions || 0) + (b.metrics.news_mentions || 0)) - 
                 ((a.metrics.reddit_mentions || 0) + (a.metrics.news_mentions || 0));
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  };

  if (loading) {
    return React.createElement('div', { className: 'min-h-screen bg-gradient-to-r from-blue-600 to-purple-700 flex items-center justify-center' },
      React.createElement('div', { className: 'text-center text-white' },
        React.createElement('h1', { className: 'text-4xl font-bold mb-4' }, 'Political Sentiment Tracker'),
        React.createElement('div', { className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto' })
      )
    );
  }

  const sortedCandidates = getSortedCandidates();

  return React.createElement('div', { className: 'min-h-screen bg-gray-50' },
    // Header
    React.createElement('header', { className: 'bg-gradient-to-r from-blue-600 to-purple-700 text-white' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12' },
        React.createElement('div', { className: 'text-center' },
          React.createElement('h1', { className: 'text-4xl md:text-6xl font-bold mb-4' }, 'Political Sentiment Tracker'),
          React.createElement('p', { className: 'text-xl md:text-2xl mb-8 text-blue-100' }, 'Track, vote, and analyze political sentiment in real-time'),
          
          // Quick Stats
          React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto' },
            React.createElement('div', { className: 'bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm' },
              React.createElement('div', { className: 'text-3xl font-bold' }, candidates.length),
              React.createElement('div', { className: 'text-blue-100' }, 'Candidates')
            ),
            React.createElement('div', { className: 'bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm' },
              React.createElement('div', { className: 'text-3xl font-bold' }, 
                Object.values(candidateMetrics).reduce((sum, metrics) => sum + (metrics.vote_count || 0), 0).toLocaleString()
              ),
              React.createElement('div', { className: 'text-blue-100' }, 'Total Votes')
            ),
            React.createElement('div', { className: 'bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm' },
              React.createElement('div', { className: 'text-3xl font-bold' }, 'Live'),
              React.createElement('div', { className: 'text-blue-100' }, 'Updates')
            ),
            React.createElement('div', { className: 'bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm' },
              React.createElement('div', { className: 'text-3xl font-bold' }, '24/7'),
              React.createElement('div', { className: 'text-blue-100' }, 'Tracking')
            )
          )
        )
      )
    ),
    
    // Controls
    React.createElement('div', { className: 'bg-white shadow-sm border-b' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4' },
        React.createElement('div', { className: 'flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0' },
          React.createElement('div', { className: 'flex items-center space-x-4' },
            React.createElement('label', { className: 'text-sm font-medium text-gray-700' }, 'Sort by:'),
            React.createElement('select', {
              value: sortBy,
              onChange: (e) => setSortBy(e.target.value),
              className: 'border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
            },
              React.createElement('option', { value: 'votes' }, 'Most Votes'),
              React.createElement('option', { value: 'sentiment' }, 'Best Sentiment'),
              React.createElement('option', { value: 'mentions' }, 'Most Mentions'),
              React.createElement('option', { value: 'name' }, 'Name (A-Z)')
            )
          ),
          React.createElement('button', {
            onClick: loadData,
            disabled: refreshing,
            className: 'flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors'
          }, refreshing ? 'Refreshing...' : 'Refresh')
        )
      )
    ),

    // Main Content with Sidebar Layout
    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' },
      React.createElement('div', { className: 'lg:grid lg:grid-cols-4 lg:gap-8' },
        // Main Content Area
        React.createElement('div', { className: 'lg:col-span-3' },
          // Top 3 Candidates - Highlighted Above Main Grid
          sortedCandidates.length > 0 && React.createElement('div', { className: 'mb-16' },
            React.createElement('h2', { className: 'text-4xl font-bold text-center mb-12 text-gray-900' }, '🏆 Leading the Stage'),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto' },
              sortedCandidates.slice(0, 3).map((candidate, index) => {
                const gradientClass = index === 0 ? 'from-blue-500 to-blue-700' :
                                    index === 1 ? 'from-red-500 to-red-700' :
                                    'from-purple-500 to-purple-700';
                
                const badgeClass = index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
                                  index === 1 ? 'bg-gray-400' : 'bg-orange-500';
                
                const textColorClass = index === 0 ? 'text-blue-200' : 
                                      index === 1 ? 'text-red-200' : 'text-purple-200';
                
                return React.createElement('div', {
                  key: candidate.id,
                  className: 'relative bg-gradient-to-br rounded-2xl p-8 text-white transform hover:scale-105 transition-transform duration-200 ' + gradientClass
                },
                  React.createElement('div', {
                    className: 'absolute -top-4 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center text-black font-bold text-xl ' + badgeClass
                  }, '#' + (index + 1)),
                  React.createElement('div', { className: 'text-center' },
                    React.createElement('div', { className: 'w-32 h-32 rounded-full mx-auto mb-6 border-4 border-white bg-gray-300 flex items-center justify-center text-2xl font-bold text-gray-600' },
                      candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()
                    ),
                    React.createElement('h3', { className: 'text-3xl font-bold mb-2' }, candidate.name),
                    React.createElement('p', { className: 'mb-4 ' + textColorClass },
                      candidate.party + ' • #' + (index + 1) + ' Overall'
                    ),
                    React.createElement('div', { className: 'grid grid-cols-2 gap-4 mb-6' },
                      React.createElement('div', { className: 'bg-white bg-opacity-20 rounded-lg p-3' },
                        React.createElement('div', { className: 'text-2xl font-bold' },
                          (candidateMetrics[candidate.id] && candidateMetrics[candidate.id].vote_count || 0).toLocaleString()
                        ),
                        React.createElement('div', { className: 'text-sm ' + textColorClass }, 'Votes')
                      ),
                      React.createElement('div', { className: 'bg-white bg-opacity-20 rounded-lg p-3' },
                        React.createElement('div', { className: 'text-2xl font-bold' },
                          (candidateMetrics[candidate.id] && candidateMetrics[candidate.id].reddit_sentiment > 0 ? '+' : '') +
                          (candidateMetrics[candidate.id] && candidateMetrics[candidate.id].reddit_sentiment || 0).toFixed(2)
                        ),
                        React.createElement('div', { className: 'text-sm ' + textColorClass }, 'Sentiment')
                      )
                    ),
                    React.createElement('button', { className: 'w-full bg-white text-gray-900 font-bold py-3 rounded-lg hover:bg-gray-100 transition-colors' },
                      'View Full Profile'
                    )
                  )
                );
              })
            )
          ),

          // Remaining Candidates - 5-Column Grid
          sortedCandidates.length > 3 && React.createElement('div', {},
            React.createElement('h2', { className: 'text-3xl font-bold mb-8 text-gray-900' }, 'All Candidates on Stage'),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4' },
              sortedCandidates.slice(3).map((candidate, index) =>
                React.createElement('div', {
                  key: candidate.id,
                  className: 'bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4'
                },
                  React.createElement('div', { className: 'text-center' },
                    React.createElement('div', { className: 'relative' },
                      React.createElement('div', { className: 'w-16 h-16 rounded-full mx-auto mb-3 bg-gray-300 flex items-center justify-center text-lg font-bold text-gray-600' },
                        candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()
                      ),
                      React.createElement('span', { className: 'absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full' },
                        '#' + (index + 4)
                      )
                    ),
                    React.createElement('h3', { className: 'font-bold text-lg mb-1' }, candidate.name),
                    React.createElement('p', { className: 'text-blue-600 text-sm mb-3' }, candidate.party),
                    React.createElement('div', { className: 'grid grid-cols-2 gap-2 mb-3' },
                      React.createElement('div', { className: 'bg-blue-50 rounded p-2' },
                        React.createElement('div', { className: 'font-bold text-sm' },
                          (candidateMetrics[candidate.id] && candidateMetrics[candidate.id].vote_count || 0).toLocaleString()
                        ),
                        React.createElement('div', { className: 'text-xs text-gray-600' }, 'Votes')
                      ),
                      React.createElement('div', { className: 'bg-green-50 rounded p-2' },
                        React.createElement('div', { className: 'font-bold text-sm text-green-600' },
                          (candidateMetrics[candidate.id] && candidateMetrics[candidate.id].reddit_sentiment > 0 ? '+' : '') +
                          (candidateMetrics[candidate.id] && candidateMetrics[candidate.id].reddit_sentiment || 0).toFixed(2)
                        ),
                        React.createElement('div', { className: 'text-xs text-gray-600' }, 'Sentiment')
                      )
                    ),
                    React.createElement('div', { className: 'flex space-x-2' },
                      React.createElement('button', { className: 'flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700' }, 'Vote'),
                      React.createElement('button', { className: 'flex-1 border border-gray-300 py-2 px-3 rounded text-sm hover:bg-gray-50' }, 'Details')
                    )
                  )
                )
              )
            )
          )
        ),

        // Sidebar
        React.createElement('div', { className: 'lg:col-span-1 mt-8 lg:mt-0' },
          React.createElement('div', { className: 'space-y-6' },
            // Advanced Analytics & Insights
            React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
              React.createElement('h3', { className: 'text-xl font-bold mb-4 text-gray-900' }, '📊 Advanced Analytics & Insights'),
              
              // Geographic Performance
              React.createElement('div', { className: 'mb-6' },
                React.createElement('h4', { className: 'font-semibold text-gray-800 mb-3' }, '🗺️ Geographic Leaders'),
                React.createElement('div', { className: 'space-y-3' },
                  React.createElement('div', { className: 'flex justify-between items-center' },
                    React.createElement('span', { className: 'text-sm' }, '🤠 Texas'),
                    React.createElement('div', { className: 'text-right' },
                      React.createElement('div', { className: 'font-bold text-sm' }, 'Trump'),
                      React.createElement('div', { className: 'text-xs text-gray-600' }, '8.9K votes')
                    )
                  ),
                  React.createElement('div', { className: 'flex justify-between items-center' },
                    React.createElement('span', { className: 'text-sm' }, '🌴 California'),
                    React.createElement('div', { className: 'text-right' },
                      React.createElement('div', { className: 'font-bold text-sm' }, 'Biden'),
                      React.createElement('div', { className: 'text-xs text-gray-600' }, '12.3K votes')
                    )
                  ),
                  React.createElement('div', { className: 'flex justify-between items-center' },
                    React.createElement('span', { className: 'text-sm' }, '🗽 New York'),
                    React.createElement('div', { className: 'text-right' },
                      React.createElement('div', { className: 'font-bold text-sm' }, 'Biden'),
                      React.createElement('div', { className: 'text-xs text-gray-600' }, '8.7K votes')
                    )
                  )
                )
              ),

              // Today's Winners
              React.createElement('div', { className: 'mb-6' },
                React.createElement('h4', { className: 'font-semibold text-gray-800 mb-3' }, '🏆 Today\'s Winners'),
                React.createElement('ul', { className: 'space-y-2' },
                  React.createElement('li', { className: 'flex items-center justify-between text-sm' },
                    React.createElement('span', {}, '🔥 Most Votes'),
                    React.createElement('span', { className: 'font-medium' }, 'Biden')
                  ),
                  React.createElement('li', { className: 'flex items-center justify-between text-sm' },
                    React.createElement('span', {}, '📱 Most Social Buzz'),
                    React.createElement('span', { className: 'font-medium' }, 'Haley')
                  ),
                  React.createElement('li', { className: 'flex items-center justify-between text-sm' },
                    React.createElement('span', {}, '📈 Biggest Jump'),
                    React.createElement('span', { className: 'font-medium' }, 'DeSantis')
                  )
                )
              ),

              // Demographic Insights
              React.createElement('div', {},
                React.createElement('h4', { className: 'font-semibold text-gray-800 mb-3' }, '👥 Demographic Leaders'),
                React.createElement('div', { className: 'space-y-3' },
                  React.createElement('div', {},
                    React.createElement('div', { className: 'flex justify-between mb-1' },
                      React.createElement('span', { className: 'text-sm' }, '18-29 Age Group'),
                      React.createElement('span', { className: 'font-medium text-sm' }, 'AOC')
                    ),
                    React.createElement('div', { className: 'w-full bg-gray-200 rounded-full h-2' },
                      React.createElement('div', { className: 'bg-pink-500 h-2 rounded-full', style: { width: '65%' } })
                    )
                  ),
                  React.createElement('div', {},
                    React.createElement('div', { className: 'flex justify-between mb-1' },
                      React.createElement('span', { className: 'text-sm' }, '30-49 Age Group'),
                      React.createElement('span', { className: 'font-medium text-sm' }, 'Biden')
                    ),
                    React.createElement('div', { className: 'w-full bg-gray-200 rounded-full h-2' },
                      React.createElement('div', { className: 'bg-blue-500 h-2 rounded-full', style: { width: '58%' } })
                    )
                  )
                )
              )
            ),

            // Historical Performance
            React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
              React.createElement('h3', { className: 'text-xl font-bold mb-4 text-gray-900' }, '📈 Historical Performance'),
              React.createElement('div', { className: 'space-y-4' },
                React.createElement('div', { className: 'bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4' },
                  React.createElement('h4', { className: 'font-semibold text-green-800 mb-2' }, 'Recent Trends (30 Days)'),
                  React.createElement('div', { className: 'space-y-2 text-sm' },
                    React.createElement('div', {}, '📅 30 days ago: Trump led by 15%'),
                    React.createElement('div', {}, '📅 7 days ago: Biden surge began'),
                    React.createElement('div', {}, '📅 Today: Biden takes the lead'),
                    React.createElement('div', {}, '🔥 Biggest mover: DeSantis (+47%)')
                  )
                ),
                React.createElement('div', { className: 'bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4' },
                  React.createElement('h4', { className: 'font-semibold text-blue-800 mb-2' }, 'Live Tracking'),
                  React.createElement('div', { className: 'space-y-2 text-sm' },
                    React.createElement('div', { className: 'flex items-center justify-between' },
                      React.createElement('span', {}, 'Vote Velocity:'),
                      React.createElement('span', { className: 'font-medium text-green-600' }, '+347 votes/min')
                    ),
                    React.createElement('div', { className: 'flex items-center justify-between' },
                      React.createElement('span', {}, 'Active Discussions:'),
                      React.createElement('span', { className: 'font-medium' }, '18.2K')
                    )
                  )
                ),
                React.createElement('div', { className: 'text-center' },
                  React.createElement('button', { className: 'w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all text-sm' },
                    '📊 View Full Timeline'
                  )
                )
              )
            )
          )
        )
      )
    )
  );
}

// Render the app directly
ReactDOM.render(React.createElement(HomePage), document.getElementById('root'));