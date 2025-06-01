// Political Sentiment Tracker - Swiss-Newspaper Modern with Tabloid Easter Egg
const { useState, useEffect } = React;

// Theme definitions
const themes = {
  modern: {
    name: 'Swiss-Newspaper Modern',
    className: 'theme-modern'
  },
  fireOrange: {
    name: 'Fire Orange Energy',
    className: 'theme-fire-orange'
  },
  crimsonPower: {
    name: 'Crimson Power Fury', 
    className: 'theme-crimson-power'
  },
  originalStage: {
    name: 'Original PoliticalStage',
    className: 'theme-original-stage'
  }
};

// HomePage Component with Theme Switching
function HomePage() {
  const [candidates, setCandidates] = useState([]);
  const [candidateMetrics, setCandidateMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('grid');
  const [sortBy, setSortBy] = useState('votes');
  const [refreshing, setRefreshing] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('modern');
  const [easterEggClicks, setEasterEggClicks] = useState(0);

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

  const getPartyColor = (party) => {
    if (!party) return 'gray';
    if (party.toLowerCase().includes('democrat')) return 'blue';
    if (party.toLowerCase().includes('republican')) return 'red';
    return 'purple';
  };

  const handleEasterEggClick = () => {
    const newClickCount = easterEggClicks + 1;
    setEasterEggClicks(newClickCount);
    
    if (newClickCount === 1) {
      setCurrentTheme('fireOrange');
    } else if (newClickCount === 2) {
      setCurrentTheme('crimsonPower');
    } else if (newClickCount === 3) {
      setCurrentTheme('originalStage');
    } else {
      setCurrentTheme('modern');
      setEasterEggClicks(0);
    }
  };

  if (loading) {
    return React.createElement('div', { className: 'min-h-screen bg-gray-50 flex items-center justify-center' },
      React.createElement('div', { className: 'text-center' },
        React.createElement('h1', { className: 'text-4xl font-light mb-4' }, 'PoliticalStage'),
        React.createElement('div', { className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto' })
      )
    );
  }

  const sortedCandidates = getSortedCandidates();
  const topThree = sortedCandidates.slice(0, 3);
  const remaining = sortedCandidates.slice(3);

  // Modern Swiss-Newspaper Theme
  if (currentTheme === 'modern') {
    return React.createElement('div', { className: 'min-h-screen bg-gray-50 text-black' },
      // Modern Swiss-Newspaper Header
      React.createElement('header', { className: 'bg-white border-b border-gray-200' },
        React.createElement('div', { className: 'max-w-7xl mx-auto px-6 py-10' },
          React.createElement('div', { className: 'grid grid-cols-12 gap-5 items-end' },
            React.createElement('div', { className: 'col-span-7' },
              React.createElement('div', { className: 'text-xs text-gray-500 mb-4 font-medium tracking-widest uppercase' },
                'Real-Time Political Intelligence • January 13, 2024'
              ),
              React.createElement('h1', { className: 'text-6xl font-light tracking-tight mb-3' },
                'Political',
                React.createElement('span', { className: 'font-semibold italic', style: { fontFamily: "'Playfair Display', serif" } }, 'Stage')
              ),
              React.createElement('div', { 
                className: 'mb-3',
                style: { 
                  background: 'linear-gradient(90deg, #000 0%, #666 50%, #000 100%)',
                  height: '1px'
                }
              }),
              React.createElement('p', { className: 'text-lg font-light text-gray-600' },
                'Precision analytics for the modern political landscape'
              )
            ),
            React.createElement('div', { className: 'col-span-5' },
              React.createElement('div', { className: 'grid grid-cols-3 gap-4 text-center' },
                React.createElement('div', { className: 'bg-white border border-gray-300 p-4' },
                  React.createElement('div', { className: 'text-2xl font-light' }, '847K'),
                  React.createElement('div', { className: 'text-xs text-gray-600 uppercase tracking-wider' }, 'Votes')
                ),
                React.createElement('div', { className: 'bg-white border border-gray-300 p-4' },
                  React.createElement('div', { className: 'text-2xl font-light' }, 'Live'),
                  React.createElement('div', { className: 'text-xs text-gray-600 uppercase tracking-wider' }, 'Updates')
                ),
                React.createElement('div', { className: 'bg-white border border-gray-300 p-4' },
                  React.createElement('div', { className: 'text-2xl font-light' }, '24/7'),
                  React.createElement('div', { className: 'text-xs text-gray-600 uppercase tracking-wider' }, 'Coverage')
                )
              )
            )
          )
        )
      ),

      // Main Content
      React.createElement('main', { className: 'max-w-7xl mx-auto px-6 py-12' },
        // Top Stats Section - 4 Achievement Cards
        React.createElement('section', { className: 'mb-16' },
          React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-4' },
            React.createElement('div', { className: 'bg-white border border-gray-300 p-4 relative' },
              React.createElement('div', { 
                className: 'absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full'
              }, '🔥'),
              React.createElement('div', { className: 'text-2xl font-light text-gray-900' }, '+47.2K'),
              React.createElement('div', { className: 'text-sm text-gray-600 font-medium' }, 'Most Votes in 24h'),
              React.createElement('div', { className: 'text-xs text-gray-500 mt-1' }, '🏆 ' + (sortedCandidates[0]?.name || 'Joe Biden'))
            ),
            
            React.createElement('div', { className: 'bg-white border border-gray-300 p-4 relative' },
              React.createElement('div', { 
                className: 'absolute -top-1 -right-1 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full'
              }, '📈'),
              React.createElement('div', { className: 'text-2xl font-light text-gray-900' }, '+127%'),
              React.createElement('div', { className: 'text-sm text-gray-600 font-medium' }, 'Biggest Rank Jump'),
              React.createElement('div', { className: 'text-xs text-gray-500 mt-1' }, '🚀 Ron DeSantis')
            ),
            
            React.createElement('div', { className: 'bg-white border border-gray-300 p-4 relative' },
              React.createElement('div', { 
                className: 'absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full'
              }, '📍'),
              React.createElement('div', { className: 'text-2xl font-light text-gray-900' }, '8.9K'),
              React.createElement('div', { className: 'text-sm text-gray-600 font-medium' }, 'Top in Texas Today'),
              React.createElement('div', { className: 'text-xs text-gray-500 mt-1' }, '🤠 Donald Trump')
            ),
            
            React.createElement('div', { className: 'bg-white border border-gray-300 p-4 relative' },
              React.createElement('div', { 
                className: 'absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full'
              }, '📱'),
              React.createElement('div', { className: 'text-2xl font-light text-gray-900' }, '89.3K'),
              React.createElement('div', { className: 'text-sm text-gray-600 font-medium' }, 'Social Mentions/24h'),
              React.createElement('div', { className: 'text-xs text-gray-500 mt-1' }, '📲 Nikki Haley')
            )
          )
        ),

        // Current Leadership & Analytics Combined
        React.createElement('div', { className: 'grid grid-cols-12 gap-6 mb-16' },
          // Current Leadership (reduced to 9 columns)
          React.createElement('div', { className: 'col-span-9' },
            React.createElement('div', { className: 'mb-8' },
              React.createElement('h2', { 
                className: 'text-3xl font-light mb-4',
                style: { fontFamily: "'Playfair Display', serif" }
              }, 'Current Leadership'),
              React.createElement('div', { 
                className: 'max-w-24 mb-6',
                style: { 
                  background: 'linear-gradient(90deg, #000 0%, #666 50%, #000 100%)',
                  height: '1px'
                }
              })
            ),
            
            React.createElement('div', { className: 'grid grid-cols-3 gap-4' },
              ...topThree.map((candidate, index) => {
                const partyColor = getPartyColor(candidate.party);
                const colorMap = {
                  blue: 'blue-600',
                  red: 'red-600', 
                  purple: 'purple-600'
                };
                const textColor = `text-${colorMap[partyColor]}`;
                
                return React.createElement('div', { 
                  key: candidate.id,
                  className: 'col-span-1'
                },
                  React.createElement('div', { className: 'bg-white border border-gray-300 p-6 h-full' },
                    React.createElement('div', { className: 'flex items-start justify-between mb-4' },
                      React.createElement('div', { className: `text-4xl font-light ${textColor}` }, 
                        String(index + 1).padStart(2, '0')
                      ),
                      React.createElement('div', { className: 'text-right text-xs' },
                        React.createElement('div', { className: 'font-medium' }, candidate.party || 'Independent'),
                        React.createElement('div', { className: 'text-gray-500' }, 
                          index === 0 ? 'Leading' : index === 1 ? 'Strong 2nd' : 'Rising 3rd'
                        )
                      )
                    ),
                    
                    React.createElement('h3', { 
                      className: 'text-lg font-medium mb-4',
                      style: { fontFamily: "'Playfair Display', serif" }
                    }, candidate.name),
                    
                    React.createElement('div', { className: 'grid grid-cols-1 gap-3 text-sm mb-4' },
                      React.createElement('div', { className: 'text-center p-2 bg-gray-50' },
                        React.createElement('div', { className: 'text-xl font-light' },
                          (candidateMetrics[candidate.id] && candidateMetrics[candidate.id].vote_count || 0).toLocaleString()
                        ),
                        React.createElement('div', { className: 'text-gray-600 uppercase tracking-wider text-xs' }, 'Votes')
                      ),
                      React.createElement('div', { className: 'text-center p-2 bg-gray-50' },
                        React.createElement('div', { className: 'text-xl font-light text-green-600' },
                          (candidateMetrics[candidate.id] && candidateMetrics[candidate.id].reddit_sentiment > 0 ? '+' : '') +
                          (candidateMetrics[candidate.id] && candidateMetrics[candidate.id].reddit_sentiment || 0).toFixed(2)
                        ),
                        React.createElement('div', { className: 'text-gray-600 uppercase tracking-wider text-xs' }, 'Sentiment')
                      )
                    ),
                    
                    React.createElement('div', { className: 'text-xs text-gray-500 uppercase tracking-wider' },
                      index === 0 ? 'Frontrunner maintains lead' :
                      index === 1 ? 'Strong position' :
                      'Rising momentum'
                    )
                  )
                );
              })
            )
          ),

          // Analytics Sidebar (moved up to match leadership height)
          React.createElement('div', { className: 'col-span-3' },
            React.createElement('div', { className: 'bg-white border border-gray-300 p-6 h-full' },
              React.createElement('h3', { 
                className: 'text-lg font-medium mb-6',
                style: { fontFamily: "'Playfair Display', serif" }
              }, 'Analytics Dashboard'),
              
              React.createElement('div', { className: 'space-y-6' },
                React.createElement('div', {},
                  React.createElement('h4', { className: 'font-medium mb-3 text-sm uppercase tracking-wider' }, 'Regional Data'),
                  React.createElement('div', { className: 'space-y-3 text-sm' },
                    React.createElement('div', { className: 'flex justify-between border-b border-gray-100 pb-2' },
                      React.createElement('span', { className: 'font-medium' }, 'Texas'),
                      React.createElement('span', {}, 'Trump • 8.9K')
                    ),
                    React.createElement('div', { className: 'flex justify-between border-b border-gray-100 pb-2' },
                      React.createElement('span', { className: 'font-medium' }, 'California'),
                      React.createElement('span', {}, 'Biden • 12.3K')
                    ),
                    React.createElement('div', { className: 'flex justify-between' },
                      React.createElement('span', { className: 'font-medium' }, 'New York'),
                      React.createElement('span', {}, 'Biden • 8.7K')
                    )
                  )
                ),
                
                React.createElement('div', { className: 'border-t border-gray-200 pt-6' },
                  React.createElement('h4', { className: 'font-medium mb-3 text-sm uppercase tracking-wider' }, 'Live Metrics'),
                  React.createElement('div', { className: 'space-y-3 text-sm' },
                    React.createElement('div', { className: 'flex justify-between' },
                      React.createElement('span', {}, 'Vote Velocity'),
                      React.createElement('span', { className: 'font-medium' }, '+347/min')
                    ),
                    React.createElement('div', { className: 'flex justify-between' },
                      React.createElement('span', {}, 'Active Users'),
                      React.createElement('span', { className: 'font-medium' }, '18.2K')
                    ),
                    React.createElement('div', { className: 'flex justify-between' },
                      React.createElement('span', {}, 'Daily Updates'),
                      React.createElement('span', { className: 'font-medium' }, '1,247')
                    )
                  )
                )
              )
            )
          )
        ),

        // All Candidates Section
        React.createElement('section', {},
          React.createElement('h2', { 
            className: 'text-2xl font-light mb-8 border-b border-gray-300 pb-4',
            style: { fontFamily: "'Playfair Display', serif" }
          }, 'All Candidates'),
          
          React.createElement('div', { className: 'grid grid-cols-5 gap-3' },
            ...remaining.map((candidate, index) => {
              return React.createElement('div', { 
                key: candidate.id,
                className: 'bg-white border border-gray-300 p-4 text-center'
              },
                React.createElement('div', { className: 'text-lg font-medium mb-2' }, 
                  String(index + 4).padStart(2, '0')
                ),
                React.createElement('h3', { 
                  className: 'font-medium text-sm mb-2',
                  style: { fontFamily: "'Playfair Display', serif" }
                }, candidate.name),
                React.createElement('div', { 
                  className: `text-xs mb-2 ${getPartyColor(candidate.party) === 'red' ? 'text-red-600' : 'text-blue-600'}`
                }, candidate.party || 'Independent'),
                React.createElement('div', { className: 'text-xs' },
                  (candidateMetrics[candidate.id] && candidateMetrics[candidate.id].vote_count || 0).toLocaleString()
                )
              );
            })
          )
        )
      ),

      // Easter Egg Footer
      React.createElement('footer', { className: 'bg-white border-t border-gray-200 py-8' },
        React.createElement('div', { className: 'max-w-7xl mx-auto px-6 text-center' },
          React.createElement('div', { className: 'text-sm text-gray-500 mb-4' },
            'PoliticalStage • Real-time political intelligence platform'
          ),
          React.createElement('div', { className: 'text-xs text-gray-400' },
            'Click the ',
            React.createElement('span', { 
              className: 'cursor-pointer hover:text-gray-600 transition-colors select-none',
              onClick: handleEasterEggClick,
              title: 'π'
            }, 'π'),
            ' for a surprise!'
          )
        )
      )
    );
  }

  // Fire Orange Theme
  if (currentTheme === 'fireOrange') {
    return React.createElement('div', { className: 'min-h-screen bg-orange-50' },
      // Fire Orange Header
      React.createElement('header', { 
        className: 'border-b-4 border-orange-800',
        style: { background: 'linear-gradient(135deg, #ff4500 0%, #ff6347 50%, #ff8c00 100%)' }
      },
        React.createElement('div', { 
          className: 'text-white py-3 text-center border-b-2 border-orange-600',
          style: { background: '#ff4500', animation: 'pulseFire 1.5s infinite' }
        },
          React.createElement('div', { 
            className: 'text-sm font-black uppercase tracking-wider',
            style: { animation: 'shake 0.5s infinite' }
          }, '🔥🔥🔥 POLITICAL VOLCANO ERUPTING! VOTES EXPLODING! 🔥🔥🔥')
        ),
        
        React.createElement('div', { className: 'max-w-7xl mx-auto px-4 py-6' },
          React.createElement('div', { className: 'grid grid-cols-12 gap-6 items-center' },
            React.createElement('div', { className: 'col-span-8' },
              React.createElement('div', { className: 'text-xs font-black uppercase tracking-widest text-orange-100 mb-2' },
                '🚨 BLAZING HOT • JANUARY 13, 2024 • ISSUE #247 🚨'
              ),
              React.createElement('h1', { 
                className: 'text-7xl font-black tracking-tight mb-2 text-white drop-shadow-lg',
                style: { fontFamily: "'Playfair Display', serif" }
              },
                'POLITICAL',
                React.createElement('span', { className: 'text-yellow-300' }, 'INFERNO')
              ),
              React.createElement('p', { className: 'text-xl font-black text-orange-100 uppercase tracking-wide' },
                '"WHERE DEMOCRACY BURNS BRIGHTEST!"'
              )
            ),
            React.createElement('div', { className: 'col-span-4' },
              React.createElement('div', { 
                className: 'bg-white border-4 border-orange-800 p-4 shadow-2xl',
                style: { 
                  transform: 'rotate(3deg)',
                  boxShadow: '0 0 50px #ff4500',
                  animation: 'pulseFire 1.5s infinite'
                }
              },
                React.createElement('div', { className: 'text-center' },
                  React.createElement('div', { className: 'text-4xl font-black text-orange-600' }, '847K'),
                  React.createElement('div', { className: 'text-sm font-black uppercase text-orange-800' }, 'VOTES ON FIRE!'),
                  React.createElement('div', { className: 'text-xs font-black text-red-600 mt-1' }, '🔥 MELTING SERVERS!')
                )
              )
            )
          )
        )
      ),

      // Fire Orange Content
      React.createElement('main', { className: 'max-w-7xl mx-auto px-4 py-8' },
        React.createElement('section', { className: 'mb-12' },
          React.createElement('div', { 
            className: 'bg-orange-600 border-4 border-orange-800 p-4 mb-6 text-white transform -rotate-1',
            style: { boxShadow: '0 0 50px #ff4500' }
          },
            React.createElement('h2', { 
              className: 'text-4xl font-black text-center',
              style: { 
                fontFamily: "'Playfair Display', serif",
                animation: 'shake 0.5s infinite'
              }
            }, '🌋 POLITICAL EARTHQUAKE! WHO\'S SURVIVING THE CHAOS?! 🌋')
          ),
          
          React.createElement('div', { className: 'grid grid-cols-12 gap-6' },
            ...topThree.map((candidate, index) => {
              const colors = ['orange', 'red', 'yellow'];
              const color = colors[index];
              const emojis = ['🔥 UNSTOPPABLE FORCE!', '⚡ LIGHTNING STRIKES!', '🚀 ROCKET FUEL!'];
              const phrases = ['MOLTEN HOT POPULARITY!', 'VOLCANIC COMEBACK!', '127% EXPLOSION RATE!'];
              
              return React.createElement('div', { 
                key: candidate.id,
                className: 'col-span-4'
              },
                React.createElement('div', { 
                  className: `bg-gradient-to-br from-${color}-200 to-${color}-300 border-4 border-${color}-600 p-6 shadow-xl`,
                  style: { 
                    transform: index % 2 === 0 ? 'rotate(1deg)' : 'rotate(-1deg)',
                    boxShadow: '0 0 50px #ff4500'
                  }
                },
                  React.createElement('div', { className: 'text-center' },
                    React.createElement('div', { 
                      className: `bg-${color}-600 text-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4`,
                      style: { animation: 'shake 0.5s infinite' }
                    },
                      React.createElement('span', { className: 'text-4xl font-black' }, `#${index + 1}`)
                    ),
                    React.createElement('div', { 
                      className: `bg-white border-4 border-${color}-600 p-4 mb-4`,
                      style: { transform: index % 2 === 0 ? 'rotate(-1deg)' : 'rotate(1deg)' }
                    },
                      React.createElement('h3', { 
                        className: `text-3xl font-black mb-1 text-${color}-800`,
                        style: { fontFamily: "'Playfair Display', serif" }
                      }, `${candidate.name.split(' ')[0].toUpperCase()} EXPLODES!`),
                      React.createElement('p', { className: `text-sm font-black text-${color}-600 uppercase` }, emojis[index])
                    ),
                    
                    React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
                      React.createElement('div', { 
                        className: `bg-white border-3 border-${color}-600 p-3`,
                        style: { transform: 'rotate(2deg)' }
                      },
                        React.createElement('div', { className: `text-3xl font-black text-${color}-600` },
                          (candidateMetrics[candidate.id] && candidateMetrics[candidate.id].vote_count || 0).toLocaleString()
                        ),
                        React.createElement('div', { className: 'text-xs font-black uppercase' }, 'ATOMIC VOTES!')
                      ),
                      React.createElement('div', { 
                        className: `bg-white border-3 border-${color}-600 p-3`,
                        style: { transform: 'rotate(-2deg)' }
                      },
                        React.createElement('div', { className: 'text-3xl font-black text-green-600' },
                          (candidateMetrics[candidate.id] && candidateMetrics[candidate.id].reddit_sentiment > 0 ? '+' : '') +
                          (candidateMetrics[candidate.id] && candidateMetrics[candidate.id].reddit_sentiment || 0).toFixed(2)
                        ),
                        React.createElement('div', { className: 'text-xs font-black uppercase' }, 'LOVE BOMB!')
                      )
                    ),
                    
                    React.createElement('div', { 
                      className: `bg-yellow-300 border-2 border-${color}-600 p-3 mt-4`,
                      style: { transform: 'rotate(1deg)' }
                    },
                      React.createElement('div', { className: `text-sm font-black text-${color}-800 uppercase` }, `"${phrases[index]}"`)
                    )
                  )
                )
              );
            })
          )
        )
      ),

      // Fire Easter Egg Footer
      React.createElement('footer', { className: 'bg-orange-600 border-t-4 border-orange-800 py-8' },
        React.createElement('div', { className: 'max-w-7xl mx-auto px-4 text-center' },
          React.createElement('div', { className: 'text-xl font-black text-white mb-4' },
            '🔥 POLITICAL INFERNO - DEMOCRACY BURNS BRIGHT! 🔥'
          ),
          React.createElement('div', { className: 'text-sm font-black text-orange-100' },
            'Click the ',
            React.createElement('span', { 
              className: 'cursor-pointer hover:text-yellow-300 transition-colors select-none text-yellow-400',
              onClick: handleEasterEggClick,
              title: 'π'
            }, 'π'),
            ' to change the heat level!'
          )
        )
      )
    );
  }

  // Crimson Power Theme
  return React.createElement('div', { className: 'min-h-screen bg-red-50' },
    // Crimson Power Header
    React.createElement('header', { 
      className: 'border-b-4 border-red-900',
      style: { background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #ef4444 100%)' }
    },
      React.createElement('div', { 
        className: 'bg-red-900 text-white py-3 text-center border-b-2 border-red-700'
      },
        React.createElement('div', { 
          className: 'text-sm font-black uppercase tracking-wider',
          style: { animation: 'powersurge 0.4s infinite' }
        }, '⚡⚡⚡ POLITICAL FURY! MAXIMUM POWER UNLEASHED! ⚡⚡⚡')
      ),
      
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 py-6' },
        React.createElement('div', { className: 'grid grid-cols-12 gap-6 items-center' },
          React.createElement('div', { className: 'col-span-8' },
            React.createElement('div', { className: 'text-xs font-black uppercase tracking-widest text-red-100 mb-2' },
              '⚡ FURY MODE • JANUARY 13, 2024 • UNSTOPPABLE! ⚡'
            ),
            React.createElement('h1', { 
              className: 'text-7xl font-black tracking-tight mb-2 text-white drop-shadow-lg',
              style: { fontFamily: "'Playfair Display', serif" }
            },
              'POLITICAL',
              React.createElement('span', { className: 'text-yellow-300' }, 'FURY')
            ),
            React.createElement('p', { className: 'text-xl font-black text-red-100 uppercase tracking-wide' },
              '"UNLEASHING DEMOCRACY\'S ULTIMATE POWER!"'
            )
          ),
          React.createElement('div', { className: 'col-span-4' },
            React.createElement('div', { 
              className: 'bg-white border-4 border-red-900 p-4',
              style: { 
                transform: 'rotate(3deg)',
                boxShadow: '0 0 35px #b91c1c, 0 0 70px #b91c1c',
                animation: 'crimsonrage 1.8s infinite'
              }
            },
              React.createElement('div', { className: 'text-center' },
                React.createElement('div', { className: 'text-4xl font-black text-red-600' }, '847K'),
                React.createElement('div', { className: 'text-sm font-black uppercase text-red-800' }, 'FURY VOTES!'),
                React.createElement('div', { className: 'text-xs font-black text-yellow-600 mt-1' }, '⚡ UNLEASHED!')
              )
            )
          )
        )
      )
    ),

    // Crimson Power Content
    React.createElement('main', { className: 'max-w-7xl mx-auto px-4 py-8' },
      React.createElement('section', { className: 'mb-12' },
        React.createElement('div', { 
          className: 'bg-red-700 border-4 border-red-900 p-4 mb-6 text-white transform -rotate-1',
          style: { boxShadow: '0 0 70px #b91c1c' }
        },
          React.createElement('h2', { 
            className: 'text-4xl font-black text-center',
            style: { 
              fontFamily: "'Playfair Display', serif",
              animation: 'powersurge 0.4s infinite'
            }
          }, '🔥 POLITICAL APOCALYPSE! WHO\'S UNLEASHING THE FURY?! 🔥')
        ),
        
        React.createElement('div', { className: 'grid grid-cols-12 gap-6' },
          ...topThree.map((candidate, index) => {
            const colors = ['red', 'orange', 'yellow'];
            const color = colors[index];
            const emojis = ['⚡ FURY MASTER!', '💥 POWER SURGE!', '🌪️ TORNADO!'];
            const phrases = ['UNSTOPPABLE FORCE!', 'APOCALYPSE NOW!', '127% DESTRUCTION!'];
            
            return React.createElement('div', { 
              key: candidate.id,
              className: 'col-span-4'
            },
              React.createElement('div', { 
                className: `bg-gradient-to-br from-${color}-200 to-red-200 border-4 border-${color}-700 p-6 shadow-xl`,
                style: { 
                  transform: index % 2 === 0 ? 'rotate(1deg)' : 'rotate(-1deg)',
                  boxShadow: '0 0 70px #b91c1c'
                }
              },
                React.createElement('div', { className: 'text-center' },
                  React.createElement('div', { 
                    className: `bg-${color}-700 text-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4`,
                    style: { animation: 'powersurge 0.4s infinite' }
                  },
                    React.createElement('span', { className: 'text-4xl font-black' }, `#${index + 1}`)
                  ),
                  React.createElement('div', { 
                    className: `bg-white border-4 border-${color}-700 p-4 mb-4`,
                    style: { transform: index % 2 === 0 ? 'rotate(-1deg)' : 'rotate(1deg)' }
                  },
                    React.createElement('h3', { 
                      className: `text-3xl font-black mb-1 text-${color}-800`,
                      style: { fontFamily: "'Playfair Display', serif" }
                    }, `${candidate.name.split(' ')[0].toUpperCase()} RAGES!`),
                    React.createElement('p', { className: `text-sm font-black text-${color}-600 uppercase` }, emojis[index])
                  ),
                  
                  React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
                    React.createElement('div', { 
                      className: `bg-white border-3 border-${color}-700 p-3`,
                      style: { transform: 'rotate(2deg)' }
                    },
                      React.createElement('div', { className: `text-3xl font-black text-${color}-600` },
                        (candidateMetrics[candidate.id] && candidateMetrics[candidate.id].vote_count || 0).toLocaleString()
                      ),
                      React.createElement('div', { className: 'text-xs font-black uppercase' }, 'RAGE VOTES!')
                    ),
                    React.createElement('div', { 
                      className: `bg-white border-3 border-${color}-700 p-3`,
                      style: { transform: 'rotate(-2deg)' }
                    },
                      React.createElement('div', { className: 'text-3xl font-black text-green-600' },
                        (candidateMetrics[candidate.id] && candidateMetrics[candidate.id].reddit_sentiment > 0 ? '+' : '') +
                        (candidateMetrics[candidate.id] && candidateMetrics[candidate.id].reddit_sentiment || 0).toFixed(2)
                      ),
                      React.createElement('div', { className: 'text-xs font-black uppercase' }, 'FURY LOVE!')
                    )
                  ),
                  
                  React.createElement('div', { 
                    className: `bg-yellow-300 border-2 border-${color}-700 p-3 mt-4`,
                    style: { transform: 'rotate(1deg)' }
                  },
                    React.createElement('div', { className: `text-sm font-black text-${color}-800 uppercase` }, `"${phrases[index]}"`)
                  )
                )
              )
            );
          })
        )
      )
    ),

    // Crimson Easter Egg Footer
    React.createElement('footer', { className: 'bg-red-700 border-t-4 border-red-900 py-8' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 text-center' },
        React.createElement('div', { className: 'text-xl font-black text-white mb-4' },
          '⚡ POLITICAL FURY - MAXIMUM POWER UNLEASHED! ⚡'
        ),
        React.createElement('div', { className: 'text-sm font-black text-red-100' },
          'Click the ',
          React.createElement('span', { 
            className: 'cursor-pointer hover:text-yellow-300 transition-colors select-none text-yellow-400',
            onClick: handleEasterEggClick,
            title: 'π'
          }, 'π'),
          ' for more themes!'
        )
      )
    )
  );

  // Original PoliticalStage Theme
  if (currentTheme === 'originalStage') {
    return React.createElement('div', { className: 'min-h-screen bg-gray-50' },
      // Original Header - Exact Recreation
      React.createElement('header', { 
        className: 'bg-gradient-to-r from-blue-800 to-purple-700 text-white relative overflow-hidden',
        style: { background: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)' }
      },
        React.createElement('div', { className: 'absolute inset-0 bg-black opacity-20' }),
        React.createElement('div', { className: 'absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-10 transform -skew-y-1' }),
        React.createElement('div', { className: 'relative max-w-7xl mx-auto px-4 py-10' },
          React.createElement('div', { className: 'text-center' },
            React.createElement('h1', { 
              className: 'text-5xl font-bold mb-3 tracking-tight bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent' 
            }, 
              'Political',
              React.createElement('span', { className: 'text-yellow-300' }, 'Stage')
            ),
            React.createElement('p', { className: 'text-lg mb-6 text-blue-100' }, '🎭 Where Politics Takes Center Stage'),
            
            // Dynamic 24-Hour Achievement Stats (Original Style)
            React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto' },
              React.createElement('div', { className: 'bg-black bg-opacity-30 backdrop-blur-sm rounded-lg p-3 relative border border-white border-opacity-20' },
                React.createElement('div', { 
                  className: 'absolute -top-1 -right-1 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse',
                  style: { background: 'linear-gradient(45deg, #ef4444, #dc2626)', animation: 'pulse 2s infinite' }
                }, '🔥'),
                React.createElement('div', { className: 'text-2xl font-bold text-white' }, '+47.2K'),
                React.createElement('div', { className: 'text-sm text-gray-200' }, 'Most Votes in 24h'),
                React.createElement('div', { className: 'text-xs text-yellow-300 mt-1' }, '🏆 ' + (sortedCandidates[0]?.name || 'Joe Biden'))
              ),
              
              React.createElement('div', { className: 'bg-black bg-opacity-30 backdrop-blur-sm rounded-lg p-3 relative border border-white border-opacity-20' },
                React.createElement('div', { 
                  className: 'absolute -top-1 -right-1 text-white text-xs font-bold px-2 py-1 rounded-full',
                  style: { background: 'linear-gradient(45deg, #10b981, #059669)' }
                }, '📈'),
                React.createElement('div', { className: 'text-2xl font-bold text-white' }, '+127%'),
                React.createElement('div', { className: 'text-sm text-gray-200' }, 'Biggest Rank Jump'),
                React.createElement('div', { className: 'text-xs text-yellow-300 mt-1' }, '🚀 Ron DeSantis')
              ),
              
              React.createElement('div', { className: 'bg-black bg-opacity-30 backdrop-blur-sm rounded-lg p-3 relative border border-white border-opacity-20' },
                React.createElement('div', { 
                  className: 'absolute -top-1 -right-1 text-white text-xs font-bold px-2 py-1 rounded-full',
                  style: { background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)' }
                }, '📍'),
                React.createElement('div', { className: 'text-2xl font-bold text-white' }, '8.9K'),
                React.createElement('div', { className: 'text-sm text-gray-200' }, 'Top in Texas Today'),
                React.createElement('div', { className: 'text-xs text-yellow-300 mt-1' }, '🤠 Donald Trump')
              ),
              
              React.createElement('div', { className: 'bg-black bg-opacity-30 backdrop-blur-sm rounded-lg p-3 relative border border-white border-opacity-20' },
                React.createElement('div', { 
                  className: 'absolute -top-1 -right-1 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full' 
                }, '📱'),
                React.createElement('div', { className: 'text-2xl font-bold text-white' }, '89.3K'),
                React.createElement('div', { className: 'text-sm text-gray-200' }, 'Social Mentions/24h'),
                React.createElement('div', { className: 'text-xs text-yellow-300 mt-1' }, '📲 Nikki Haley')
              )
            )
          )
        )
      ),

      // Main Content - Original Style
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 py-8' },
        React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-4 gap-8' },
          // Main Content
          React.createElement('div', { className: 'lg:col-span-3' },
            React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6 mb-6' },
              React.createElement('h2', { className: 'text-2xl font-bold mb-6 text-gray-900' }, '🏆 Current Ranking - Top Candidates'),
              
              React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
                ...topThree.map((candidate, index) => {
                  const partyColor = getPartyColor(candidate.party);
                  
                  return React.createElement('div', { 
                    key: candidate.id,
                    className: index === 0 ? 'leader-highlight bg-white border-4 border-yellow-400 rounded-lg p-4 relative' : 
                              'bg-white border border-gray-200 rounded-lg p-4 relative hover:shadow-lg transition-shadow'
                  },
                    index === 0 && React.createElement('div', { 
                      className: 'absolute -top-2 -right-2 w-12 h-12 rank-crown rounded-full flex items-center justify-center text-white font-bold text-lg' 
                    }, '👑'),
                    
                    React.createElement('div', { className: 'flex items-center justify-between mb-4' },
                      React.createElement('div', { className: `text-3xl font-bold ${partyColor === 'red' ? 'text-red-600' : partyColor === 'blue' ? 'text-blue-600' : 'text-purple-600'}` }, 
                        '#' + (index + 1)
                      ),
                      React.createElement('div', { className: `px-3 py-1 rounded-full text-xs font-bold ${partyColor === 'red' ? 'bg-red-100 text-red-800' : partyColor === 'blue' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}` },
                        candidate.party || 'Independent'
                      )
                    ),
                    React.createElement('h3', { className: 'text-xl font-bold mb-3 text-gray-900' }, candidate.name),
                    React.createElement('div', { className: 'grid grid-cols-2 gap-3 mb-4' },
                      React.createElement('div', { className: 'bg-blue-50 rounded p-2' },
                        React.createElement('div', { className: 'font-bold text-sm text-blue-600' },
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
                  );
                })
              )
            )
          ),

          // Sidebar - Original with Emojis
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
                
                // Live Data Stream
                React.createElement('div', { className: 'border-t pt-4' },
                  React.createElement('h4', { className: 'font-semibold text-gray-800 mb-3' }, '📡 Live Data Stream'),
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
      ),

      // Original Footer
      React.createElement('footer', { className: 'bg-gradient-to-r from-blue-800 to-purple-700 text-white py-8' },
        React.createElement('div', { className: 'max-w-7xl mx-auto px-4 text-center' },
          React.createElement('div', { className: 'text-lg font-bold mb-4' },
            '🎭 PoliticalStage - Where Politics Takes Center Stage! 🎭'
          ),
          React.createElement('div', { className: 'text-sm text-blue-100' },
            'Click the ',
            React.createElement('span', { 
              className: 'cursor-pointer hover:text-yellow-300 transition-colors select-none text-yellow-300',
              onClick: handleEasterEggClick,
              title: 'π'
            }, 'π'),
            ' to cycle through all themes!'
          )
        )
      )
    );
  }
}

// Add CSS animations for all themes
const style = document.createElement('style');
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap');
  
  body { font-family: 'Inter', sans-serif; }
  
  @keyframes pulseFire {
    0%, 100% { background-color: #ff4500; }
    50% { background-color: #ff6347; }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-2px); }
    75% { transform: translateX(2px); }
  }
  
  @keyframes crimsonrage {
    0%, 100% { box-shadow: 0 0 35px #b91c1c; }
    50% { box-shadow: 0 0 50px #dc2626, 0 0 90px #dc2626; }
  }
  
  @keyframes powersurge {
    0%, 100% { transform: scale(1) rotateZ(0deg); }
    50% { transform: scale(1.08) rotateZ(2deg); }
  }
  
  // Original theme animations
  @keyframes shine {
    0% { box-shadow: 0 0 20px rgba(255,215,0,0.5); }
    100% { box-shadow: 0 0 30px rgba(255,215,0,0.8); }
  }
  
  .stage-gradient { 
    background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%); 
  }
  
  .leader-highlight { 
    background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,193,7,0.1) 100%);
    border: 3px solid #ffd700;
    box-shadow: 0 0 30px rgba(255,215,0,0.3);
  }
  
  .rank-crown { 
    background: linear-gradient(45deg, #ffd700, #ffed4a);
    animation: shine 2s infinite alternate;
  }
`;
document.head.appendChild(style);

// Render the app
ReactDOM.render(React.createElement(HomePage), document.getElementById('root'));