/* eslint-disable prettier/prettier */
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const userData = [
  {
    full_name: 'Renaud Biscomb',
    email: 'rbiscomb0@gmail.com',
    password: 'renaud1234',
    role: Role.Admin,
    menu: [
      {
          "Master Data": {
              "Variable Input Form": {
                  "Vendor": {
                      "Edit": "Edit",
                      "Create": "Create",
                      "Delete": "Delete"
                  },
                  "Translation": {
                      "Edit": "Edit",
                      "Create": "Create",
                      "Delete": "Delete"
                  },
                  "Non Translation": {
                      "Edit": "Edit",
                      "Create": "Create",
                      "Delete": "Delete"
                  }
              }
          }
      },
      {
          "Resource Manager": {
              "Vendor": {
                  "Edit": "Edit",
                  "Create": "Create",                  
              },
              "Translation": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete",                  
              },
              "Non Translation": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete",
                  "Import": "Import",
                  "Rating": {
                      "Create": "Create"
                  },
                  "PM Notes": {
                      "Create": "Create",
                      "Approve": "Approve"
                  }
              }
          }
      }
  ],
  },

  {
    full_name: 'Huntlee Shiliton',
    email: 'hshiliton1@gmail.com',
    password: 'huntlee1234',
    role: Role.User,
    menu: [
      {
        "Master Data": {
            "Variable Input Form": {
                  "Vendor": {
                      "Edit": "Edit",
                      "Create": "Create",
                      "Delete": "Delete"
                  },
                  "Translation": {
                      "Edit": "Edit",
                      "Create": "Create",
                      "Delete": "Delete"
                  },
                  "Non Translation": {
                      "Edit": "Edit",
                      "Create": "Create",
                      "Delete": "Delete"
                  }
              }
        }
    }
    ]
  },

  {
    full_name: 'Gael Swan',
    email: 'gswan2@gmail.com',
    password: 'gael1234',
    role: Role.User,
    menu: [
      {
        "Master Data": {
              "Tools": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete"
              },
              "Rate Type": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete"
              },
              "Financial Directory": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete"
              },
              "Variable Input Form": {
                  "Vendor": {
                      "Edit": "Edit",
                      "Create": "Create",
                      "Delete": "Delete"
                  },
                  "Translation": {
                      "Edit": "Edit",
                      "Create": "Create",
                      "Delete": "Delete"
                  },
                  "Non Translation": {
                      "Edit": "Edit",
                      "Create": "Create",
                      "Delete": "Delete"
                  }
              }
          }
    }
    ]
  },

  {
    full_name: 'Korry Lindelof',
    email: 'klindelof3@gmail.com',
    password: 'korry1234',
    role: Role.User,
    menu: [
      {
        "Master Data": {
              "Tools": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete"
              },
              "Rate Type": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete"
              },              
          }
    }
    ]
  },

  {
    full_name: 'Burr Escale',
    email: 'bescale4@gmail.com',
    password: 'burr1234',
    role: Role.Admin,
    menu: [
      {
        "Resource Manager": {
              "Vendor": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete",
                  "Import": "Import",
                  "Rating": {
                      "Create": "Create"
                  },
                  "PM Notes": {
                      "Create": "Create",
                      "Approve": "Approve"
                  }
              },
              "Translation": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete",
                  "Import": "Import",
                  "Rating": {
                      "Create": "Create"
                  },
                  "PM Notes": {
                      "Create": "Create",
                      "Approve": "Approve"
                  }
              },
              "Non Translation": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete",
                  "Import": "Import",
                  "Rating": {
                      "Create": "Create"
                  },
                  "PM Notes": {
                      "Create": "Create",
                      "Approve": "Approve"
                  }
              }
          }
    }  
    ]
  },

  {
    full_name: 'Randi Hembery',
    email: 'rhembery5@gmail.com',
    password: 'randi1234',
    role: Role.Admin,
    menu: [
      {
        "Master Data": {
            "Financial Directory": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete"
              },        
        }
    }      
    ]
  },

  {
    full_name: 'Witt Baunton',
    email: 'wbaunton6@gmail.com',
    password: 'witt1234',
    role: Role.Admin,
    menu: [
      {
        "Resource Manager": {
              "Vendor": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete",                  
              },
              "Translation": {
                  "Edit": "Edit",
                  "Create": "Create",                  
              },
              "Non Translation": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete",
                  "Import": "Import",
                  "Rating": {
                      "Create": "Create"
                  },
                  "PM Notes": {
                      "Create": "Create",
                      "Approve": "Approve"
                  }
              }
          }
      }
    ]
  },

  {
    full_name: 'Chet Last',
    email: 'clast7@gmail.com',
    password: 'chet1234',
    role: Role.User,
    menu: [
      {
        "Master Data": {
            "Tools": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete"
              },         
        }
    }
    ]
  },

  {
    full_name: 'Daaniis Raditya',
    email: 'daaniis@gmail.com',
    password: 'daaniis123',
    role: Role.Superadmin,
    menu: [
      {
          "Master Data": {
              "Tools": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete"
              },
              "Rate Type": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete"
              },
              "Financial Directory": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete"
              },
              "Variable Input Form": {
                  "Vendor": {
                      "Edit": "Edit",
                      "Create": "Create",
                      "Delete": "Delete"
                  },
                  "Translation": {
                      "Edit": "Edit",
                      "Create": "Create",
                      "Delete": "Delete"
                  },
                  "Non Translation": {
                      "Edit": "Edit",
                      "Create": "Create",
                      "Delete": "Delete"
                  }
              }
          }
      },
      {
          "Resource Manager": {
              "Vendor": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete",
                  "Import": "Import",
                  "Rating": {
                      "Create": "Create"
                  },
                  "PM Notes": {
                      "Create": "Create",
                      "Approve": "Approve"
                  }
              },
              "Translation": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete",
                  "Import": "Import",
                  "Rating": {
                      "Create": "Create"
                  },
                  "PM Notes": {
                      "Create": "Create",
                      "Approve": "Approve"
                  }
              },
              "Non Translation": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete",
                  "Import": "Import",
                  "Rating": {
                      "Create": "Create"
                  },
                  "PM Notes": {
                      "Create": "Create",
                      "Approve": "Approve"
                  }
              }
          }
      }
  ]
  },

  {
    full_name: 'Jeff Ropking',
    email: 'jropking9@gmail.com',
    password: 'jeff1234',
    role: Role.Admin,
    menu: [
      {
        "Resource Manager": {
          "Non Translation": {                  
                  "Delete": "Delete",                  
                  "Rating": {
                      "Create": "Create"
                  },                  
              }
        }
      }
    ]
  },

  {
    full_name: 'Griss Simko',
    email: 'gsimkoa@gmail.com',
    password: 'griss1234',
    role: Role.Admin,
    menu: [
      {
        "Master Data": {
            "Tools": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete"
              },         
        }
    }
    ]
  },

  {
    full_name: 'Chesl Fears',
    email: 'cfearsb@gmail.com',
    password: 'chesl1234',
    role: Role.User,
    menu: [
      {
        "Master Data": {
            "Tools": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete"
              },         
        }
    }
    ]
  },

  {
    full_name: 'Allissa Hearsey',
    email: 'ahearseyc@gmail.com',
    password: 'allissa1234',
    role: Role.User,
    menu: [
      {
        "Master Data": {
            "Tools": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete"
              },         
        }
    }
    ]
  },

  {
    full_name: 'Brandea Measures',
    email: 'bmeasuresd@gmail.com',
    password: 'brandea1234',
    role: Role.User,
    menu: [
      {
        "Master Data": {
            "Financial Directory": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete"
              },        
        }
    }      
    ]
  },

  {
    full_name: 'Lotti Lawrance',
    email: 'llawrancee@gmail.com',
    password: 'lotti1234',
    role: Role.User,
    menu: [
      {
        "Master Data": {
            "Financial Directory": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete"
              },         
        }
    }      
    ]
  },

  {
    full_name: 'Paddie Mulroy',
    email: 'pmulroyf@gmail.com',
    password: 'paddie1234',
    role: Role.Admin,
    menu: [
      {
        "Master Data": {
            "Financial Directory": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete"
              },          
        }
    }      
    ]
  },

  {
    full_name: 'Chaunce Joinson',
    email: 'cjoinsong@gmail.com',
    password: 'chaunce1234',
    role: Role.Admin,
    menu: [
      {
        "Master Data": {
            "Financial Directory": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete"
              },        
        }
    }      
    ]
  },

  {
    full_name: 'Engracia Marlowe',
    email: 'emarloweh@gmail.com',
    password: 'engracia1234',
    role: Role.Admin,
    menu: [
      {
        "Master Data": {
            "Financial Directory": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete"
              },          
        }
    }      
    ]
  },

  {
    full_name: 'Merrick Peters',
    email: 'mpetersi@gmail.com',
    password: 'merrick1234',
    role: Role.User,
    menu: [
      {
        "Master Data": {
            "Financial Directory": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete"
              },          
        }
    }      
    ]
  },
  
  {
    full_name: 'Keven Vaulkhard',
    email: 'kvaulkhardj@gmail.com',
    password: 'keven1234',
    role: Role.User,
    menu: [
      {
        "Master Data": {
            "Financial Directory": {
                  "Edit": "Edit",
                  "Create": "Create",
                  "Delete": "Delete"
              },          
        }
    }      
    ]
  },
];

async function seed() {
  for (const user of userData) {
    const hashPassword = await bcrypt.hash(user.password, 8);
    await prisma.user.createMany({
      data: {
        full_name: user.full_name,
        email: user.email,
        password: hashPassword,
        original_password: user.password,
        role: user.role,
        menu: user.menu,
      },
    });
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
